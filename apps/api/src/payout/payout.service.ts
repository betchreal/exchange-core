import {
	BadRequestException,
	forwardRef,
	HttpException,
	HttpStatus,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payout } from './entities/payout.entity';
import { Repository } from 'typeorm';
import { PluginCoreService } from '../plugin-core/plugin-core.service';
import {
	type Field,
	OrderStatus,
	PayoutMethod,
	type PayoutWebhookResponse,
	type PluginRef,
	PluginStatus,
	PluginType
} from '@exchange-core/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CurrencyService } from '../currency/currency.service';
import { RouteService } from '../route/route.service';
import Decimal from 'decimal.js';
import { ConfigService } from '@nestjs/config';
import { PluginProcess } from '../plugin-core/engine/plugin.process';

@Injectable()
export class PayoutService {
	constructor(
		@InjectRepository(Payout) private readonly payout: Repository<Payout>,
		@Inject(forwardRef(() => CurrencyService))
		private readonly currencyService: CurrencyService,
		@Inject(forwardRef(() => RouteService))
		private readonly routeService: RouteService,
		private readonly cfg: ConfigService,
		private readonly emitter: EventEmitter2,
		private readonly core: PluginCoreService
	) {}

	async install(tgzPath: string, moduleName: string) {
		const prepared = await this.core.prepare(
			tgzPath,
			moduleName,
			PluginType.PAYOUT
		);
		let payout: Payout | null = null;
		try {
			payout = await this.payout.save({
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

			if (payout.manifest.webhook?.supported)
				payout.webhookUrl = `${this.cfg.getOrThrow<string>('APP_BASE_URL')}/payout/webhook/${payout.id}`;

			return payout;
		} catch (err) {
			if (payout?.id) await this.payout.delete(payout?.id);
			throw err;
		} finally {
			await this.core.rollback(tgzPath, prepared.tempDir);
		}
	}

	async replace(id: number, config: Record<string, any>) {
		const payout = await this.payout.findOne({ where: { id } });
		if (!payout) throw new NotFoundException('Payout plugin not found.');

		if (payout.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is active.');

		this.core.validateConfig(payout.manifest.configSchema, config);

		payout.config = await this.core.encrypt(config);
		await this.payout.save(payout);
	}

	async launch(id: number) {
		const payout = await this.payout.findOne({ where: { id } });
		if (!payout) throw new NotFoundException('Payout plugin not found.');
		if (payout.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is already active.');

		const ref: PluginRef = {
			type: PluginType.PAYOUT,
			id
		};

		try {
			await this.core.launch(ref, {
				dir: payout.path,
				manifest: payout.manifest,
				encryptedConfig: payout.config
			});
			payout.status = PluginStatus.ACTIVE;
			return this.payout.save(payout);
		} catch (err) {
			payout.status = PluginStatus.DISABLED;
			await this.payout.save(payout);
			throw err;
		}
	}

	async disable(id: number) {
		const payout = await this.payout.findOne({ where: { id } });
		if (!payout) throw new NotFoundException('Payout plugin not found.');
		if (payout.status !== PluginStatus.ACTIVE) return payout;

		const ref: PluginRef = {
			type: PluginType.PAYOUT,
			id
		};

		this.core.stop(ref);

		payout.status = PluginStatus.DISABLED;
		await this.currencyService.deactivateCurrenciesByPlugin(
			PluginType.PAYOUT,
			id
		);
		await this.routeService.deactivateRoutesByPlugin(PluginType.PAYOUT, id);
		return this.payout.save(payout);
	}

	async remove(id: number) {
		const payout = await this.payout.findOne({ where: { id } });
		if (!payout) throw new NotFoundException('Payout plugin not found.');

		if (payout.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is active.');

		await this.core.clearFiles(payout.path);
		await this.payout.remove(payout);
	}

	@OnEvent('payout.crashed', { async: true })
	async handleCrash(ref: PluginRef) {
		await this.payout.update(ref.id, {
			status: PluginStatus.DISABLED
		});

		await this.currencyService.deactivateCurrenciesByPlugin(
			PluginType.PAYOUT,
			ref.id
		);
		await this.routeService.deactivateRoutesByPlugin(
			PluginType.PAYOUT,
			ref.id
		);
	}

	async getOne(id: number) {
		const payout = await this.payout.findOne({ where: { id } });
		if (!payout) throw new NotFoundException('Payout plugin not found.');

		if (payout.manifest.webhook?.supported)
			payout.webhookUrl = `${this.cfg.getOrThrow<string>('APP_BASE_URL')}/payout/webhook/${payout.id}`;

		return payout;
	}

	async getList(code?: string) {
		const plugins = await this.payout.find();
		if (!code) return plugins;
		return plugins.filter((plugin) =>
			plugin.manifest.allowCurrencyCodes?.includes(code)
		);
	}

	async getFields(id: number, code: string): Promise<Field[]> {
		const payout = await this.payout.findOne({ where: { id } });
		if (!payout) throw new Error('Payout plugin not found.');

		if (payout.status !== PluginStatus.ACTIVE)
			throw new Error('Payout plugin is not active.');

		const ref: PluginRef = {
			type: PluginType.PAYOUT,
			id
		};

		const proc = this.core.getOrThrow(ref);

		const fields = await proc.call(
			PayoutMethod.GET_FIELDS,
			code,
			payout.manifest.timeouts.callMs
		);

		if (!this.core.isFieldArray(fields)) {
			await this.disable(id);
			throw new Error('Invalid fields.');
		}
		return fields;
	}

	async transfer(id: number, code: string, amount: Decimal, args: any) {
		const payout = await this.payout.findOne({ where: { id } });
		if (!payout) throw new Error('Payout plugin not found.');

		if (payout.status !== PluginStatus.ACTIVE)
			throw new Error('Payout plugin is not active.');

		const ref: PluginRef = {
			type: PluginType.PAYOUT,
			id
		};

		const proc = this.core.getOrThrow(ref);

		const txId = await proc.call(
			PayoutMethod.TRANSFER,
			{ code, amount: amount.toString(), args },
			payout.manifest.timeouts.callMs
		);

		if (typeof txId !== 'string') {
			await this.disable(id);
			throw new Error('Incorrect txId type.');
		}
		return txId;
	}

	async checkStatus(id: number, txId: string) {
		const payout = await this.payout.findOne({ where: { id } });
		if (!payout) throw new Error('Payout plugin not found.');

		if (payout.status !== PluginStatus.ACTIVE)
			throw new Error('Payout plugin is not active.');

		const ref: PluginRef = {
			type: PluginType.PAYOUT,
			id
		};

		const proc = this.core.getOrThrow(ref);

		const status = await proc.call(
			PayoutMethod.CHECK_STATUS,
			txId,
			payout.manifest.timeouts.callMs
		);

		if (!this.isAllowedOrderStatus(status)) {
			await this.disable(id);
			throw new Error('Invalid status.');
		}

		return status;
	}

	async handleWebhook(
		id: number,
		payload: any,
		headers: Record<string, string>
	) {
		const payout = await this.payout.findOne({ where: { id } });
		if (!payout) throw new NotFoundException();

		if (payout.status !== PluginStatus.ACTIVE)
			throw new HttpException('Plugin is disabled.', HttpStatus.GONE);

		const ref: PluginRef = {
			type: PluginType.PAYOUT,
			id
		};

		let proc: PluginProcess;
		try {
			proc = this.core.getOrThrow(ref);
		} catch {
			return;
		}

		let result: unknown;
		try {
			result = await proc.call(
				PayoutMethod.WEBHOOK_HANDLER,
				{ payload, headers },
				payout.manifest.timeouts.callMs
			);
		} catch (err) {
			throw new BadRequestException(err.message);
		}

		if (!this.isCorrectWebhookResponse(result)) {
			await this.disable(id);
			return;
		}

		this.emitter.emit('payout.webhook', {
			id,
			txId: result.txId,
			status: result.status
		});
	}

	async getVerificationData(id: number) {
		const payout = await this.payout.findOne({ where: { id } });
		if (!payout) throw new Error();

		if (payout.status !== PluginStatus.ACTIVE) throw new Error();

		const ref: PluginRef = {
			type: PluginType.PAYOUT,
			id
		};

		const proc = this.core.getOrThrow(ref);

		return proc.call(
			PayoutMethod.GET_VERIFICATION_DATA,
			null,
			payout.manifest.timeouts.callMs
		);
	}

	async findForVerification(endpoint: string) {
		return this.payout
			.createQueryBuilder('payout')
			.where("payout.manifest->'webhook'->>'endpoint' = :endpoint", {
				endpoint
			})
			.andWhere('payout.status = :status', {
				status: PluginStatus.ACTIVE
			})
			.getOne();
	}

	private isAllowedOrderStatus(
		status: unknown
	): status is
		| OrderStatus.IN_PAYOUT
		| OrderStatus.SUCCESS
		| OrderStatus.ERROR_PAYOUT {
		return (
			typeof status === 'string' &&
			(status === OrderStatus.IN_PAYOUT ||
				status === OrderStatus.SUCCESS ||
				status === OrderStatus.ERROR_PAYOUT)
		);
	}
	private isCorrectWebhookResponse(
		result: unknown
	): result is PayoutWebhookResponse {
		if (!result || typeof result !== 'object') return false;
		if (!('txId' in result) || typeof result.txId !== 'string')
			return false;
		if (!('status' in result) || !this.isAllowedOrderStatus(result.status))
			return false;
		return true;
	}
}
