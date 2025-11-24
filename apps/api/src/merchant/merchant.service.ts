import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Merchant } from './entities/merchant.entity';
import { Repository } from 'typeorm';
import { ManualMerchant } from './entities/manual-merchant.entity';
import { PluginCoreService } from '../plugin-core/plugin-core.service';
import {
	type PluginRef,
	PluginStatus,
	PluginType
} from '@exchange-core/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ManualMerchantDto } from './dtos/manual-merchant.dto';
import { CurrencyService } from '../currency/currency.service';
import { RouteService } from '../route/route.service';

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
		return merchant;
	}

	async createManualMerchant(dto: ManualMerchantDto) {
		const manual = this.manualMerchant.create(dto);
		return this.manualMerchant.save(manual);
	}

	async deleteManualMerchant(id: number) {
		await this.manualMerchant.delete(id);
	}
}
