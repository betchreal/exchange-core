import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Aml } from './entities/aml.entity';
import { Repository } from 'typeorm';
import {
	type PluginRef,
	PluginStatus,
	PluginType
} from '@exchange-core/common';
import { PluginCoreService } from '../plugin-core/plugin-core.service';
import { OnEvent } from '@nestjs/event-emitter';
import { CurrencyService } from '../currency/currency.service';
import { RouteService } from '../route/route.service';

@Injectable()
export class AmlService {
	constructor(
		@InjectRepository(Aml) private readonly aml: Repository<Aml>,
		@Inject(forwardRef(() => CurrencyService))
		private readonly currencyService: CurrencyService,
		@Inject(forwardRef(() => RouteService))
		private readonly routeService: RouteService,
		private readonly core: PluginCoreService
	) {}

	async install(tgzPath: string, moduleName: string) {
		const prepared = await this.core.prepare(
			tgzPath,
			moduleName,
			PluginType.AML
		);
		let aml: Aml | null = null;
		try {
			aml = await this.aml.save({
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
			return aml;
		} catch (err) {
			if (aml?.id) await this.aml.delete(aml?.id);
			throw err;
		} finally {
			await this.core.rollback(tgzPath, prepared.tempDir);
		}
	}

	async replace(id: number, config: Record<string, any>) {
		const aml = await this.aml.findOne({ where: { id } });
		if (!aml) throw new NotFoundException('Aml plugin not found.');

		if (aml.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is active.');

		this.core.validateConfig(aml.manifest.configSchema, config);

		aml.config = await this.core.encrypt(config);
		await this.aml.save(aml);
	}

	async launch(id: number) {
		const aml = await this.aml.findOne({ where: { id } });
		if (!aml) throw new NotFoundException('Aml plugin not found.');
		if (aml.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is already active.');

		const ref: PluginRef = {
			type: PluginType.AML,
			id
		};

		try {
			await this.core.launch(ref, {
				dir: aml.path,
				manifest: aml.manifest,
				encryptedConfig: aml.config
			});
			aml.status = PluginStatus.ACTIVE;
			return this.aml.save(aml);
		} catch (err) {
			aml.status = PluginStatus.DISABLED;
			await this.aml.save(aml);
			throw err;
		}
	}

	async disable(id: number) {
		const aml = await this.aml.findOne({ where: { id } });
		if (!aml) throw new NotFoundException('Aml plugin not found.');
		if (aml.status !== PluginStatus.ACTIVE) return aml;

		const ref: PluginRef = {
			type: PluginType.AML,
			id
		};

		this.core.stop(ref);

		aml.status = PluginStatus.DISABLED;
		await this.currencyService.deactivateCurrenciesByPlugin(
			PluginType.AML,
			id
		);
		await this.routeService.deactivateRoutesByPlugin(PluginType.AML, id);
		return this.aml.save(aml);
	}

	async remove(id: number) {
		const aml = await this.aml.findOne({ where: { id } });
		if (!aml) throw new NotFoundException('Aml plugin not found.');

		if (aml.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is active.');

		await this.core.clearFiles(aml.path);
		await this.aml.remove(aml);
	}

	@OnEvent('aml.crashed', { async: true })
	async handleCrash(ref: PluginRef) {
		await this.aml.update(ref.id, {
			status: PluginStatus.DISABLED
		});

		await this.currencyService.deactivateCurrenciesByPlugin(
			PluginType.AML,
			ref.id
		);
		await this.routeService.deactivateRoutesByPlugin(
			PluginType.AML,
			ref.id
		);
	}

	async getOne(id: number) {
		const aml = await this.aml.findOne({ where: { id } });
		if (!aml) throw new NotFoundException('Aml plugin not found.');
		return aml;
	}

	async getList() {
		return this.aml.find();
	}
}
