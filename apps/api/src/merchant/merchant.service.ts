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
import { Merchant } from './entities/merchant.entity';
import { Raw, Repository } from 'typeorm';
import { ManualMerchant } from './entities/manual-merchant.entity';
import { PluginCoreService } from '../plugin-core/plugin-core.service';
import {
	type Field,
	MerchantMethod,
	type MerchantWebhookResponse,
	OrderStatus,
	PaymentDetailsReponse,
	type PluginRef,
	PluginStatus,
	PluginType
} from '@exchange-core/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ManualMerchantDto } from './dtos/manual-merchant.dto';
import { CurrencyService } from '../currency/currency.service';
import { RouteService } from '../route/route.service';
import { ConfigService } from '@nestjs/config';
import { PluginProcess } from '../plugin-core/engine/plugin.process';
import Decimal from 'decimal.js';

@Injectable()
export class MerchantService {
	constructor(
		@InjectRepository(Merchant)
		private readonly merchant: Repository<Merchant>,
		@InjectRepository(ManualMerchant)
		private readonly manualMerchant: Repository<ManualMerchant>,
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
			PluginType.MERCHANT
		);
		let merchant: Merchant | null = null;
		try {
			merchant = await this.merchant.save({
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

			merchant.webhookUrl = `${this.cfg.getOrThrow<string>('APP_BASE_URL')}/merchant/webhook/${merchant.id}`;

			return merchant;
		} catch (err) {
			if (merchant?.id) await this.merchant.delete(merchant?.id);
			throw err;
		} finally {
			await this.core.rollback(tgzPath, prepared.tempDir);
		}
	}

	async replace(id: number, config: Record<string, any>) {
		const merchant = await this.merchant.findOne({ where: { id } });
		if (!merchant)
			throw new NotFoundException('Merchant plugin not found.');

		if (merchant.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is active.');

		this.core.validateConfig(merchant.manifest.configSchema, config);

		merchant.config = await this.core.encrypt(config);
		await this.merchant.save(merchant);
	}

	async launch(id: number) {
		const merchant = await this.merchant.findOne({ where: { id } });
		if (!merchant)
			throw new NotFoundException('Merchant plugin not found.');
		if (merchant.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is already active.');

		const ref: PluginRef = {
			type: PluginType.MERCHANT,
			id
		};

		try {
			await this.core.launch(ref, {
				dir: merchant.path,
				manifest: merchant.manifest,
				encryptedConfig: merchant.config
			});
			merchant.status = PluginStatus.ACTIVE;
			return this.merchant.save(merchant);
		} catch (err) {
			merchant.status = PluginStatus.DISABLED;
			await this.merchant.save(merchant);
			throw err;
		}
	}

	async disable(id: number) {
		const merchant = await this.merchant.findOne({ where: { id } });
		if (!merchant)
			throw new NotFoundException('Merchant plugin not found.');
		if (merchant.status !== PluginStatus.ACTIVE) return merchant;

		const ref: PluginRef = {
			type: PluginType.MERCHANT,
			id
		};

		this.core.stop(ref);

		merchant.status = PluginStatus.DISABLED;
		await this.currencyService.deactivateCurrenciesByPlugin(
			PluginType.MERCHANT,
			id
		);
		await this.routeService.deactivateRoutesByPlugin(
			PluginType.MERCHANT,
			id
		);
		return this.merchant.save(merchant);
	}

	async remove(id: number) {
		const merchant = await this.merchant.findOne({ where: { id } });
		if (!merchant)
			throw new NotFoundException('Merchant plugin not found.');

		if (merchant.status === PluginStatus.ACTIVE)
			throw new BadRequestException('Plugin is active.');

		await this.core.clearFiles(merchant.path);
		await this.merchant.remove(merchant);
	}

	@OnEvent('merchant.crashed', { async: true })
	async handleCrash(ref: PluginRef) {
		await this.merchant.update(ref.id, {
			status: PluginStatus.DISABLED
		});

		await this.currencyService.deactivateCurrenciesByPlugin(
			PluginType.MERCHANT,
			ref.id
		);
		await this.routeService.deactivateRoutesByPlugin(
			PluginType.MERCHANT,
			ref.id
		);
	}

	async getOne(id: number) {
		const merchant = await this.merchant.findOne({ where: { id } });
		if (!merchant)
			throw new NotFoundException('Merchant plugin not found.');

		merchant.webhookUrl = `${this.cfg.getOrThrow<string>('APP_BASE_URL')}/merchant/webhook/${merchant.id}`;

		return merchant;
	}

	async getList(code?: string) {
		const plugins = await this.merchant.find();
		if (!code) return plugins;
		return plugins.filter((plugin) =>
			plugin.manifest?.allowCurrencyCodes?.includes(code)
		);
	}

	async createManualMerchant(dto: ManualMerchantDto) {
		const manual = this.manualMerchant.create(dto);
		return this.manualMerchant.save(manual);
	}

	async deleteManualMerchant(id: number) {
		await this.manualMerchant.delete(id);
	}

	async getFields(id: number, code: string): Promise<Field[]> {
		const merchant = await this.merchant.findOne({ where: { id } });
		if (!merchant) throw new Error('Merchant plugin not found.');

		if (merchant.status !== PluginStatus.ACTIVE)
			throw new Error('Merchant plugin is not active.');

		const ref: PluginRef = {
			type: PluginType.MERCHANT,
			id
		};

		const proc = this.core.getOrThrow(ref);

		const fields = await proc.call(
			MerchantMethod.GET_FIELDS,
			code,
			merchant.manifest.timeouts.callMs
		);

		if (!this.core.isFieldArray(fields)) {
			await this.disable(id);
			throw new Error('Invalid fields.');
		}
		return fields;
	}

	async getPaymentDetails(id: number, code: string, args: any) {
		const merchant = await this.merchant.findOne({ where: { id } });
		if (!merchant) throw new Error('Merchant plugin not found.');

		if (merchant.status !== PluginStatus.ACTIVE)
			throw new Error('Merchant plugin is not active.');

		const ref: PluginRef = {
			type: PluginType.MERCHANT,
			id
		};

		const proc = this.core.getOrThrow(ref);

		const response = await proc.call(
			MerchantMethod.GET_PAYMENT_DETAILS,
			{ code, args },
			merchant.manifest.timeouts.callMs
		);

		if (!this.isPaymentDetailsResponse(response)) {
			await this.disable(id);
			throw new Error('Invalid payment details response.');
		}
		return response;
	}

	async handleWebhook(
		id: number,
		payload: any,
		headers: Record<string, string>
	) {
		const merchant = await this.merchant.findOne({ where: { id } });
		if (!merchant) throw new NotFoundException();

		if (merchant.status !== PluginStatus.ACTIVE)
			throw new HttpException('Plugin is disabled', HttpStatus.GONE);

		const ref: PluginRef = {
			type: PluginType.MERCHANT,
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
				MerchantMethod.WEBHOOK_HANDLER,
				{ payload, headers },
				merchant.manifest.timeouts.callMs
			);
		} catch (err) {
			throw new BadRequestException(err.message);
		}

		if (!this.isCorrectWebhookResponse(result)) {
			await this.disable(id);
			return;
		}

		console.log('WEBHOOK DATA: ', result); // !

		this.emitter.emit('merchant.webhook', {
			id,
			identifier: result.identifier,
			amount: result.amount,
			status: result.status,
			confirmations: result.confirmations
		});
	}

	async getVerificationData(id: number) {
		const merchant = await this.merchant.findOne({ where: { id } });
		if (!merchant) throw new Error();

		if (merchant.status !== PluginStatus.ACTIVE) throw new Error();

		const ref: PluginRef = {
			type: PluginType.MERCHANT,
			id
		};

		const proc = this.core.getOrThrow(ref);

		return proc.call(
			MerchantMethod.GET_VERIFICATION_DATA,
			null,
			merchant.manifest.timeouts.callMs
		);
	}

	async findForVerification(endpoint: string) {
		return this.merchant
			.createQueryBuilder('merchant')
			.where("merchant.manifest->'webhook'->>'endpoint' = :endpoint", {
				endpoint
			})
			.andWhere('merchant.status = :status', {
				status: PluginStatus.ACTIVE
			})
			.getOne();
	}

	private isPaymentDetailsResponse(
		response: unknown
	): response is PaymentDetailsReponse {
		if (!response || typeof response !== 'object') return false;

		const r = response as any;

		if (!Array.isArray(r.details)) return false;
		if (typeof r.identifier !== 'string' || r.identifier.trim() === '')
			return false;

		return r.details.every(
			(d: any) =>
				typeof d === 'object' &&
				d != null &&
				typeof d.label === 'string' &&
				typeof d.value === 'string'
		);
	}

	private isCorrectWebhookResponse(
		result: unknown
	): result is MerchantWebhookResponse {
		if (!result || typeof result !== 'object') return false;

		const r = result as any;

		if (typeof r.identifier !== 'string') return false;
		if (typeof r.amount !== 'string') return false;
		try {
			new Decimal(r.amount);
		} catch {
			return false;
		}

		if (typeof r.status !== 'string') return false;
		const validStatuses = [
			OrderStatus.PROCESSING,
			OrderStatus.IN_PAYOUT,
			OrderStatus.ERROR_PAID
		];
		if (!validStatuses.includes(r.status)) return false;

		if (!r.confirmations || typeof r.confirmations !== 'object')
			return false;
		if (typeof r.confirmations.actual !== 'number') return false;
		if (typeof r.confirmations.required !== 'number') return false;

		return true;
	}
}
