import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '@nestjs-labs/nestjs-ioredis';
import { OnEvent } from '@nestjs/event-emitter';
import { Parser } from './entities/parser.entity';
import { Repository } from 'typeorm';
import {
	ParserMethod,
	type PluginRef,
	PluginStatus,
	PluginType
} from '@exchange-core/common';
import { PluginCoreService } from '../plugin-core/plugin-core.service';
import { RouteService } from '../route/route.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PluginProcess } from '../plugin-core/engine/plugin.process';
import type Redis from 'ioredis';
import Decimal from 'decimal.js';

@Injectable()
export class ParserService {
	private readonly redis: Redis;
	constructor(
		@InjectRepository(Parser) private readonly parser: Repository<Parser>,
		private readonly redisService: RedisService,
		private readonly schedulerRegistry: SchedulerRegistry,
		@Inject(forwardRef(() => RouteService))
		private readonly routeService: RouteService,
		private readonly core: PluginCoreService
	) {
		this.redis = this.redisService.getOrThrow();
	}

	async install(tgzPath: string, moduleName: string) {
		const prepared = await this.core.prepare(
			tgzPath,
			moduleName,
			PluginType.PARSER
		);
		let parser: Parser | null = null;
		try {
			parser = await this.parser.save({
				name: prepared.manifest.name,
				version: prepared.manifest.version,
				type: prepared.manifest.type,
				path: prepared.destDir,
				manifest: prepared.manifest
			});
			await this.core.commit(
				prepared.tempDir,
				prepared.destDir,
				prepared.ticket
			);
			return parser;
		} catch (err) {
			if (parser?.id) await this.parser.delete(parser?.id);
			throw err;
		} finally {
			await this.core.rollback(tgzPath, prepared.tempDir);
		}
	}

	async replace(id: number, config: Record<string, any>) {
		const parser = await this.parser.findOne({ where: { id } });
		if (!parser) throw new NotFoundException('Parser plugin not found.');

		if (parser.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is active.');

		this.core.validateConfig(parser.manifest.configSchema, config);

		parser.config = await this.core.encrypt(config);
		await this.parser.save(parser);
	}

	async launch(id: number) {
		let parser = await this.parser.findOne({ where: { id } });
		if (!parser) throw new NotFoundException('Parser plugin not found.');
		if (parser.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is already active.');

		const ref: PluginRef = {
			type: PluginType.PARSER,
			id
		};

		let proc: PluginProcess;
		try {
			proc = await this.core.launch(ref, {
				dir: parser.path,
				manifest: parser.manifest,
				encryptedConfig: parser.config
			});
			this.createJob(parser, proc);
			parser.status = PluginStatus.ACTIVE;
			parser = await this.parser.save(parser);
		} catch (err) {
			parser.status = PluginStatus.DISABLED;
			await this.parser.save(parser);
			throw err;
		}
		return parser;
	}

	async changeInterval(id: number, newInterval: number) {
		const parser = await this.parser.findOne({ where: { id } });
		if (!parser) throw new NotFoundException('Parser plugin not found.');

		parser.intervalMs = newInterval;

		if (parser.status !== PluginStatus.ACTIVE)
			return this.parser.save(parser);

		const ref: PluginRef = {
			type: PluginType.PARSER,
			id
		};

		this.deleteJob(id);

		let proc: PluginProcess;
		try {
			proc = this.core.getOrThrow(ref);
		} catch (err) {
			throw new InternalServerErrorException(err.message);
		}
		this.createJob(parser, proc);
		return this.parser.save(parser);
	}

	async disable(id: number) {
		const parser = await this.parser.findOne({ where: { id } });
		if (!parser) throw new NotFoundException('Parser plugin not found.');
		if (parser.status !== PluginStatus.ACTIVE) return parser;

		const ref: PluginRef = {
			type: PluginType.PARSER,
			id
		};

		this.deleteJob(id);
		this.core.stop(ref);

		parser.status = PluginStatus.DISABLED;
		await this.routeService.deactivateRoutesByPlugin(PluginType.PARSER, id);
		return this.parser.save(parser);
	}

	async remove(id: number) {
		const parser = await this.parser.findOne({ where: { id } });
		if (!parser) throw new NotFoundException('Parser plugin not found.');

		if (parser.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is active.');

		await this.core.clearFiles(parser.path);
		await this.parser.remove(parser);
	}

	@OnEvent('parser.crashed', { async: true })
	async handleCrash(ref: PluginRef) {
		this.deleteJob(ref.id);

		await this.parser.update(ref.id, {
			status: PluginStatus.DISABLED
		});

		await this.routeService.deactivateRoutesByPlugin(
			PluginType.PARSER,
			ref.id
		);
	}

	async getOne(id: number) {
		const parser = await this.parser.findOne({ where: { id } });
		if (!parser) throw new NotFoundException('Parser plugin not found.');
		return parser;
	}

	async getList() {
		return this.parser.find();
	}

	async getRate(parserId: number, fromCode: string, toCode: string) {
		const key = `${parserId}:${fromCode}:${toCode}`;
		const rate = await this.redis.get(key);

		if (!rate) {
			throw new NotFoundException(
				`Rate not found for ${fromCode}:${toCode}. Parser might be inactive or pair not supported.`
			);
		}

		return new Decimal(rate);
	}

	private createJob(parser: Parser, plugin: PluginProcess) {
		const jobName = `parser-${parser.id}`;
		if (this.schedulerRegistry.getIntervals().includes(jobName)) return;

		const interval = setInterval(async () => {
			try {
				const rates = await plugin.call(
					ParserMethod.UPDATE_RATES,
					null,
					parser.manifest.timeouts.callMs
				);
				if (!this.isRatesObject(rates)) {
					throw new Error('rates are not valid.');
				}
				const ttl = Math.floor(parser.intervalMs / 1000) * 2;

				for (const [pair, rate] of Object.entries(rates)) {
					const parts = pair.split(':');
					if (parts.length !== 2)
						throw new Error('incorrect pair format.');
					const [from, to] = parts;

					if (!parser.manifest.supportedPairs![from]?.includes(to))
						throw new Error('not supported currency.');

					const rateDec = new Decimal(rate);

					if (rateDec.isNaN())
						throw new Error('rate is not a number.');
					if (!rateDec.isFinite())
						throw new Error('rate is infinite.');
					if (rateDec.lte(0)) throw new Error('rate is negative.');

					await this.redis.set(
						`${parser.id}:${pair}`,
						rate,
						'EX',
						ttl
					);
				}
			} catch (err) {
				await this.disable(parser.id);
				console.log(
					`[ParserService] #${parser.id} parser could not update rates and parser was disabled:`,
					err.message
				);
			}
		}, parser.intervalMs);

		this.schedulerRegistry.addInterval(jobName, interval);
	}

	private deleteJob(id: number) {
		const jobName = `parser-${id}`;
		try {
			this.schedulerRegistry.deleteInterval(jobName);
		} catch {
			console.log(`[ParserService] Interval ${jobName} not found`);
		}
	}

	private isRatesObject(rates: unknown): rates is Record<string, string> {
		if (rates == null || typeof rates !== 'object') return false;

		if (Object.entries(rates).length === 0) return false;

		return Object.entries(rates).every(
			([key, value]) =>
				typeof key === 'string' && typeof value === 'string'
		);
	}
}
