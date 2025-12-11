import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Currency } from './entities/currency.entity';
import { Repository, UpdateResult } from 'typeorm';
import { CurrencyCode } from './entities/currency-code.entity';
import { CreateCurrencyDto } from './dtos/create-currency.dto';
import {
	CurrencyMerchantBinding,
	PluginStatus,
	PluginType
} from '@exchange-core/common';
import { PayoutService } from '../payout/payout.service';
import { MerchantService } from '../merchant/merchant.service';
import { AmlService } from '../aml/aml.service';
import { Payout } from '../payout/entities/payout.entity';
import { Merchant } from '../merchant/entities/merchant.entity';
import { ManualMerchant } from '../merchant/entities/manual-merchant.entity';
import { Aml } from '../aml/entities/aml.entity';
import { UpdateCurrencyDto } from './dtos/update-currency.dto';
import { RouteService } from '../route/route.service';

@Injectable()
export class CurrencyService {
	constructor(
		@InjectRepository(Currency)
		private readonly currency: Repository<Currency>,
		@InjectRepository(CurrencyCode)
		private readonly currencyCode: Repository<CurrencyCode>,
		@Inject(forwardRef(() => RouteService))
		private readonly routeService: RouteService,
		@Inject(forwardRef(() => PayoutService))
		private readonly payoutService: PayoutService,
		@Inject(forwardRef(() => MerchantService))
		private readonly merchantService: MerchantService,
		@Inject(forwardRef(() => AmlService))
		private readonly amlService: AmlService
	) {}

	async create(dto: CreateCurrencyDto) {
		let payout: Payout | undefined;
		let merchant: Merchant | undefined;
		let manualMerchant: ManualMerchant | undefined;
		let aml: Aml | undefined;

		const code = await this.currencyCode.findOne({
			where: { code: dto.code }
		});
		if (!code) throw new NotFoundException('Code not found.');

		if (dto.payoutId) {
			payout = await this.payoutService.getOne(dto.payoutId);
			if (payout.status !== PluginStatus.ACTIVE)
				throw new BadRequestException('Payout plugin is not active.');
			if (
				payout.manifest.allowCurrencyCodes!.length === 0 ||
				!payout.manifest.allowCurrencyCodes!.includes(code.code)
			)
				throw new BadRequestException(
					'Payout plugin does not work with this currency.'
				);
		}

		if (dto.amlId) {
			aml = await this.amlService.getOne(dto.amlId);
			if (aml.status !== PluginStatus.ACTIVE)
				throw new BadRequestException('Aml plugin is not active.');
		}

		if (dto.merchantBinding === CurrencyMerchantBinding.EXPLICIT) {
			merchant = await this.merchantService.getOne(dto.merchantId!);
			if (merchant.status !== PluginStatus.ACTIVE)
				throw new BadRequestException('Merchant plugin is not active.');
			if (
				merchant.manifest.allowCurrencyCodes!.length === 0 ||
				!merchant.manifest.allowCurrencyCodes!.includes(code.code)
			)
				throw new BadRequestException(
					'Merchant plugin does not work with this currency.'
				);
		} else {
			manualMerchant = await this.merchantService.createManualMerchant(
				dto.manualMerchant!
			);
		}

		const currency = this.currency.create({
			name: dto.name,
			ticker: dto.ticker,
			precision: dto.precision,
			iconUrl: dto.iconUrl,
			reserve: dto.reserve,
			depositFields: dto.depositFields,
			withdrawFields: dto.withdrawFields,
			active: dto.active,
			merchantBinding: dto.merchantBinding,
			code,
			payout,
			merchant,
			manualMerchant,
			aml
		});

		try {
			return await this.currency.save(currency);
		} catch (err) {
			if (manualMerchant?.id)
				await this.merchantService.deleteManualMerchant(
					manualMerchant.id
				);
			throw err;
		}
	}

	async deactivateCurrenciesByPlugin(type: PluginType, id: number) {
		let currencyIds: number[] = [];
		switch (type) {
			case PluginType.PAYOUT:
				const payoutCurrencies = await this.currency.find({
					where: { payout: { id } },
					select: ['id']
				});
				currencyIds = payoutCurrencies.map((c) => c.id);

				await this.currency.update(
					{ payout: { id } },
					{ payout: null, active: false }
				);
				break;
			case PluginType.MERCHANT:
				const merchantCurrencies = await this.currency.find({
					where: {
						merchantBinding: CurrencyMerchantBinding.EXPLICIT,
						merchant: { id }
					},
					select: ['id']
				});
				currencyIds = merchantCurrencies.map((c) => c.id);

				await this.currency.update(
					{
						merchantBinding: CurrencyMerchantBinding.EXPLICIT,
						merchant: { id }
					},
					{ merchant: null, active: false }
				);
				break;
			case PluginType.AML:
				const amlCurrencies = await this.currency.find({
					where: { aml: { id } },
					select: ['id']
				});
				currencyIds = amlCurrencies.map((c) => c.id);

				await this.currency.update(
					{ aml: { id } },
					{ aml: null, active: false }
				);
				break;
			default:
				break;
		}

		await this.routeService.deactivateRoutesByCurrencies(currencyIds);

		console.log(
			`[CurrencyService] Deactivated currencies due to ${type} plugin #${id} failure;`
		);
	}

	async update(id: number, dto: UpdateCurrencyDto) {
		const currency = await this.currency.findOne({
			where: { id },
			relations: ['code', 'payout', 'merchant', 'manualMerchant', 'aml']
		});
		if (!currency) throw new NotFoundException('Currency not found.');

		if (
			(dto.merchantId != null || dto.manualMerchant != null) &&
			dto.merchantBinding == null
		)
			throw new BadRequestException(
				'merchantBinding is required when updating merchantId or manualMerchant.'
			);

		let newManualMerchant: ManualMerchant | undefined;
		const oldManualMerchantId = currency.manualMerchant?.id;

		if (dto.code != null) {
			const code = await this.currencyCode.findOne({
				where: { code: dto.code }
			});
			if (!code) throw new NotFoundException('Currency code not found.');
			currency.code = code;
		}

		if (dto.payoutId !== undefined) {
			if (dto.payoutId === null) {
				currency.payout = null;
			} else {
				const payout = await this.payoutService.getOne(dto.payoutId);
				if (payout.status !== PluginStatus.ACTIVE)
					throw new BadRequestException(
						'Payout plugin is not active.'
					);
				if (
					payout.manifest.allowCurrencyCodes!.length === 0 ||
					!payout.manifest.allowCurrencyCodes!.includes(
						currency.code.code
					)
				)
					throw new BadRequestException(
						'Payout plugin does not work with this currency.'
					);
				currency.payout = payout;
			}
		}

		if (dto.amlId !== undefined) {
			if (dto.amlId === null) {
				currency.aml = null;
			} else {
				const aml = await this.amlService.getOne(dto.amlId);
				if (aml.status !== PluginStatus.ACTIVE)
					throw new BadRequestException('Aml plugin is not active.');
				currency.aml = aml;
			}
		}

		if (dto.merchantBinding != null) {
			if (dto.merchantBinding === CurrencyMerchantBinding.EXPLICIT) {
				const merchant = await this.merchantService.getOne(
					dto.merchantId!
				);
				if (merchant.status !== PluginStatus.ACTIVE)
					throw new BadRequestException(
						'Merchant plugin is not active.'
					);
				if (
					merchant.manifest.allowCurrencyCodes!.length === 0 ||
					!merchant.manifest.allowCurrencyCodes!.includes(
						currency.code.code
					)
				)
					throw new BadRequestException(
						'Merchant plugin does not work with this currency.'
					);

				currency.merchantBinding = CurrencyMerchantBinding.EXPLICIT;
				currency.merchant = merchant;
				currency.manualMerchant = null;
			} else if (dto.merchantBinding === CurrencyMerchantBinding.MANUAL) {
				newManualMerchant =
					await this.merchantService.createManualMerchant(
						dto.manualMerchant!
					);

				currency.merchantBinding = CurrencyMerchantBinding.MANUAL;
				currency.merchant = null;
				currency.manualMerchant = newManualMerchant;
			}
		}

		if (dto.name != null) currency.name = dto.name;
		if (dto.ticker != null) currency.ticker = dto.ticker;
		if (dto.precision != null) currency.precision = dto.precision;
		if (dto.iconUrl !== undefined) currency.iconUrl = dto.iconUrl;
		if (dto.reserve != null) currency.reserve = dto.reserve;
		if (dto.depositFields != null)
			currency.depositFields = dto.depositFields;
		if (dto.withdrawFields != null)
			currency.withdrawFields = dto.withdrawFields;
		if (dto.active != null) {
			if (dto.active && !currency.merchant && !currency.manualMerchant)
				throw new BadRequestException(
					'Cannot activate currency without merchant.'
				);
			if (!dto.active && currency.active)
				await this.routeService.deactivateRoutesByCurrencies([
					currency.id
				]);
			currency.active = dto.active;
		}

		try {
			const updated = await this.currency.save(currency);

			if (dto.merchantBinding && oldManualMerchantId)
				await this.merchantService.deleteManualMerchant(
					oldManualMerchantId
				);

			return updated;
		} catch (err) {
			if (newManualMerchant?.id)
				await this.merchantService.deleteManualMerchant(
					newManualMerchant.id
				);
			throw err;
		}
	}

	async remove(id: number) {
		const currency = await this.currency.findOne({
			where: { id },
			relations: ['manualMerchant']
		});
		if (!currency) throw new NotFoundException('Currency not found.');

		await this.routeService.removeRoutesByCurrency(currency.id);

		const manualMerchantId = currency.manualMerchant?.id;

		await this.currency.remove(currency);

		if (manualMerchantId)
			await this.merchantService.deleteManualMerchant(manualMerchantId);
	}

	async getList(search?: string, page: number = 1, limit: number = 20) {
		const queryBuilder = this.currency
			.createQueryBuilder('currency')
			.leftJoinAndSelect('currency.code', 'code')
			.leftJoinAndSelect('currency.merchant', 'merchant')
			.leftJoinAndSelect('currency.manualMerchant', 'manualMerchant')
			.leftJoinAndSelect('currency.payout', 'payout')
			.leftJoinAndSelect('currency.aml', 'aml');

		if (search && search.trim()) {
			queryBuilder.where('LOWER(currency.name) LIKE LOWER(:search)', {
				search: `%${search.trim()}%`
			});
		}

		const total = await queryBuilder.getCount();

		queryBuilder
			.skip((page - 1) * limit)
			.take(limit)
			.orderBy('currency.name', 'DESC');

		const data = await queryBuilder.getMany();

		return {
			data,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit)
		};
	}

	async getOne(id: number) {
		const currency = await this.currency.findOne({
			where: { id },
			relations: ['code', 'payout', 'merchant', 'manualMerchant', 'aml']
		});
		if (!currency) throw new NotFoundException('Currency not found.');
		return currency;
	}

	async getCodes() {
		return this.currencyCode.find();
	}
}
