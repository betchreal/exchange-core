import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Route } from './entities/route.entity';
import { Repository } from 'typeorm';
import { CurrencyService } from '../currency/currency.service';
import { CreateRouteDto } from './dtos/create-route.dto';
import { ParserService } from '../parser/parser.service';
import { PayoutService } from '../payout/payout.service';
import { MerchantService } from '../merchant/merchant.service';
import { AmlService } from '../aml/aml.service';
import { ManualMerchant } from '../merchant/entities/manual-merchant.entity';
import { Payout } from '../payout/entities/payout.entity';
import { Merchant } from '../merchant/entities/merchant.entity';
import { Aml } from '../aml/entities/aml.entity';
import {
	AmlBinding,
	PayoutBinding,
	PluginStatus,
	PluginType,
	RouteMerchantBinding
} from '@exchange-core/common';
import { UpdateRouteDto } from './dtos/update-route.dto';

@Injectable()
export class RouteService {
	constructor(
		@InjectRepository(Route) private readonly route: Repository<Route>,
		@Inject(forwardRef(() => CurrencyService))
		private readonly currencyService: CurrencyService,
		@Inject(forwardRef(() => ParserService))
		private readonly parserService: ParserService,
		@Inject(forwardRef(() => PayoutService))
		private readonly payoutService: PayoutService,
		@Inject(forwardRef(() => MerchantService))
		private readonly merchantService: MerchantService,
		@Inject(forwardRef(() => AmlService))
		private readonly amlService: AmlService
	) {}

	async create(dto: CreateRouteDto) {
		let manualMerchant: ManualMerchant | undefined;
		let payout: Payout | undefined;
		let merchant: Merchant | undefined;
		let depositAml: Aml | undefined;
		let withdrawAml: Aml | undefined;

		const fromCurrency = await this.currencyService.getOne(
			dto.fromCurrencyId
		);
		const toCurrency = await this.currencyService.getOne(dto.toCurrencyId);
		if (!fromCurrency.active || !toCurrency.active)
			throw new BadRequestException('Both currencies must be active.');

		const parser = await this.parserService.getOne(dto.parserId);
		if (parser.status !== PluginStatus.ACTIVE)
			throw new BadRequestException('Parser plugin is not active.');

		const supportedToCurrencies =
			parser.manifest.supportedPairs![dto.fromCurrencyParser];
		if (
			!supportedToCurrencies ||
			!supportedToCurrencies.includes(dto.toCurrencyParser)
		)
			throw new BadRequestException(
				`Parser does not support pair ${dto.fromCurrencyParser}/${dto.toCurrencyParser}.`
			);

		if (dto.maxFrom.lte(dto.minFrom))
			throw new BadRequestException(
				'maxFrom must be greater than minFrom.'
			);
		if (dto.maxTo.lte(dto.minTo))
			throw new BadRequestException('maxTo must be greater than minTo.');

		// TODO перевірка курсу та можливості існування шляху

		if (dto.payoutBinding === PayoutBinding.EXPLICIT) {
			payout = await this.payoutService.getOne(dto.payoutId!);
			if (payout.status !== PluginStatus.ACTIVE)
				throw new BadRequestException('Payout plugin is not active.');
			if (
				payout.manifest.allowCurrencyCodes!.length === 0 ||
				!payout.manifest.allowCurrencyCodes!.includes(
					toCurrency.code.code
				)
			)
				throw new BadRequestException(
					'Payout plugin does not work with this currency.'
				);
		}

		if (dto.merchantBinding === RouteMerchantBinding.EXPLICIT) {
			merchant = await this.merchantService.getOne(dto.merchantId!);
			if (merchant.status !== PluginStatus.ACTIVE)
				throw new BadRequestException('Merchant plugin is not active.');
			if (
				merchant.manifest.allowCurrencyCodes!.length === 0 ||
				!merchant.manifest.allowCurrencyCodes!.includes(
					fromCurrency.code.code
				)
			)
				throw new BadRequestException(
					'Merchant plugin does not work with this currency.'
				);
		} else if (dto.merchantBinding === RouteMerchantBinding.MANUAL) {
			manualMerchant = await this.merchantService.createManualMerchant(
				dto.manualMerchant!
			);
		}

		if (dto.depositAmlBinding === AmlBinding.EXPLICIT) {
			depositAml = await this.amlService.getOne(dto.depositAmlId!);
			if (depositAml.status !== PluginStatus.ACTIVE)
				throw new BadRequestException(
					'Deposit AML plugin is not active.'
				);
		}

		if (dto.withdrawAmlBinding === AmlBinding.EXPLICIT) {
			withdrawAml = await this.amlService.getOne(dto.withdrawAmlId!);
			if (withdrawAml.status !== PluginStatus.ACTIVE)
				throw new BadRequestException(
					'Withdraw AML plugin is not active.'
				);
		}

		const route = this.route.create({
			minFrom: dto.minFrom,
			maxFrom: dto.maxFrom,
			minTo: dto.minTo,
			maxTo: dto.maxTo,
			extraFields: dto.extraFields,
			active: dto.active,
			commissionAmount: dto.commissionAmount,
			commissionPercentage: dto.commissionPercentage,
			lossAmount: dto.lossAmount,
			lossPercentage: dto.lossPercentage,
			payoutBinding: dto.payoutBinding,
			merchantBinding: dto.merchantBinding,
			depositAmlBinding: dto.depositAmlBinding,
			withdrawAmlBinding: dto.withdrawAmlBinding,
			fromCurrencyParser: dto.fromCurrencyParser,
			toCurrencyParser: dto.toCurrencyParser,
			fromCurrency,
			toCurrency,
			parser,
			payout,
			merchant,
			manualMerchant,
			depositAml,
			withdrawAml
		});

		try {
			return await this.route.save(route);
		} catch (err) {
			if (manualMerchant?.id)
				await this.merchantService.deleteManualMerchant(
					manualMerchant.id
				);
			throw err;
		}
	}

	async update(id: number, dto: UpdateRouteDto) {
		const route = await this.route.findOne({
			where: { id },
			relations: [
				'fromCurrency',
				'fromCurrency.code',
				'toCurrency',
				'toCurrency.code',
				'parser',
				'payout',
				'merchant',
				'manualMerchant',
				'depositAml',
				'withdrawAml'
			]
		});
		if (!route) throw new NotFoundException('Route not found.');

		if (dto.payoutId != null && dto.payoutBinding == null)
			throw new BadRequestException(
				'payoutBinding is required when updating payoutId.'
			);
		if (
			(dto.merchantId != null || dto.manualMerchant != null) &&
			dto.merchantBinding == null
		)
			throw new BadRequestException(
				'merchantBinding is required when updating merchantId or manualMerchant.'
			);
		if (dto.depositAmlId != null && dto.depositAmlBinding == null)
			throw new BadRequestException(
				'depositAmlBinding is required when updating depositAmlId.'
			);
		if (dto.withdrawAmlId != null && dto.withdrawAmlBinding == null)
			throw new BadRequestException(
				'withdrawAmlBinding is required when updating withdrawAmlId.'
			);

		let newManualMerchant: ManualMerchant | undefined;
		const oldManualMerchantId = route.manualMerchant?.id;

		if (dto.parserId != null) {
			const parser = await this.parserService.getOne(dto.parserId);
			if (parser.status !== PluginStatus.ACTIVE)
				throw new BadRequestException('Parser plugin is not active.');

			const supportedToCurrencies =
				parser.manifest.supportedPairs![dto.fromCurrencyParser!];
			if (
				!supportedToCurrencies ||
				!supportedToCurrencies.includes(dto.toCurrencyParser!)
			)
				throw new BadRequestException(
					`Parser does not support pair ${dto.fromCurrencyParser}/${dto.toCurrencyParser}.`
				);

			route.parser = parser;
			route.fromCurrencyParser = dto.fromCurrencyParser!;
			route.toCurrencyParser = dto.toCurrencyParser!;
		}

		if (dto.payoutBinding != null) {
			if (dto.payoutBinding === PayoutBinding.EXPLICIT) {
				const payout = await this.payoutService.getOne(dto.payoutId!);
				if (payout.status !== PluginStatus.ACTIVE)
					throw new BadRequestException(
						'Payout plugin is not active.'
					);
				if (
					payout.manifest.allowCurrencyCodes!.length === 0 ||
					!payout.manifest.allowCurrencyCodes!.includes(
						route.toCurrency.code.code
					)
				)
					throw new BadRequestException(
						'Payout plugin does not work with this currency.'
					);

				route.payoutBinding = PayoutBinding.EXPLICIT;
				route.payout = payout;
			} else {
				route.payoutBinding = dto.payoutBinding;
				route.payout = null;
			}
		}

		if (dto.merchantBinding != null) {
			if (dto.merchantBinding === RouteMerchantBinding.EXPLICIT) {
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
						route.fromCurrency.code.code
					)
				)
					throw new BadRequestException(
						'Merchant plugin does not work with this currency.'
					);

				route.merchantBinding = RouteMerchantBinding.EXPLICIT;
				route.merchant = merchant;
				route.manualMerchant = null;
			} else if (dto.merchantBinding === RouteMerchantBinding.MANUAL) {
				newManualMerchant =
					await this.merchantService.createManualMerchant(
						dto.manualMerchant!
					);

				route.merchantBinding = RouteMerchantBinding.MANUAL;
				route.merchant = null;
				route.manualMerchant = newManualMerchant;
			} else {
				route.merchantBinding = RouteMerchantBinding.DEFAULT;
				route.merchant = null;
				route.manualMerchant = null;
			}
		}

		if (dto.depositAmlBinding != null) {
			if (dto.depositAmlBinding === AmlBinding.EXPLICIT) {
				const depositAml = await this.amlService.getOne(
					dto.depositAmlId!
				);
				if (depositAml.status !== PluginStatus.ACTIVE)
					throw new BadRequestException(
						'Deposit AML plugin is not active.'
					);

				route.depositAmlBinding = AmlBinding.EXPLICIT;
				route.depositAml = depositAml;
			} else {
				route.depositAmlBinding = dto.depositAmlBinding;
				route.depositAml = null;
			}
		}

		if (dto.withdrawAmlBinding != null) {
			if (dto.withdrawAmlBinding === AmlBinding.EXPLICIT) {
				const withdrawAml = await this.amlService.getOne(
					dto.withdrawAmlId!
				);
				if (withdrawAml.status !== PluginStatus.ACTIVE)
					throw new BadRequestException(
						'Withdraw AML plugin is not active.'
					);

				route.withdrawAmlBinding = AmlBinding.EXPLICIT;
				route.withdrawAml = withdrawAml;
			} else {
				route.withdrawAmlBinding = dto.withdrawAmlBinding;
				route.withdrawAml = null;
			}
		}

		if (dto.minFrom != null) route.minFrom = dto.minFrom;
		if (dto.maxFrom != null) route.maxFrom = dto.maxFrom;
		if (dto.minTo != null) route.minTo = dto.minTo;
		if (dto.maxTo != null) route.maxTo = dto.maxTo;
		if (dto.extraFields != null) route.extraFields = dto.extraFields;
		if (dto.active != null) {
			if (dto.active) {
				if (!route.fromCurrency.active || !route.toCurrency.active)
					throw new BadRequestException(
						'Cannot activate route with inactive currencies.'
					);

				if (!route.parser)
					throw new BadRequestException(
						'Cannot activate route without parser.'
					);

				if (
					route.payoutBinding === PayoutBinding.EXPLICIT &&
					!route.payout
				)
					throw new BadRequestException(
						'Cannot activate route with explicit payout binding but no payout plugin.'
					);

				if (
					route.merchantBinding === RouteMerchantBinding.EXPLICIT &&
					!route.merchant
				)
					throw new BadRequestException(
						'Cannot activate route with explicit merchant binding but no merchant plugin.'
					);
				if (
					route.merchantBinding === RouteMerchantBinding.MANUAL &&
					!route.manualMerchant
				)
					throw new BadRequestException(
						'Cannot activate route with manual merchant binding but no manual merchant.'
					);

				if (
					route.depositAmlBinding === AmlBinding.EXPLICIT &&
					!route.depositAml
				)
					throw new BadRequestException(
						'Cannot activate route with explicit deposit AML binding but no deposit AML plugin.'
					);
				if (
					route.withdrawAmlBinding === AmlBinding.EXPLICIT &&
					!route.withdrawAml
				)
					throw new BadRequestException(
						'Cannot activate route with explicit withdraw AML binding but no withdraw AML plugin.'
					);
			}
			route.active = dto.active;
		}
		if (dto.commissionAmount != null)
			route.commissionAmount = dto.commissionAmount;
		if (dto.commissionPercentage != null)
			route.commissionPercentage = dto.commissionPercentage;
		if (dto.lossAmount != null) route.lossAmount = dto.lossAmount;
		if (dto.lossPercentage != null)
			route.lossPercentage = dto.lossPercentage;

		if (route.maxFrom.lte(route.minFrom))
			throw new BadRequestException(
				'maxFrom must be greater than minFrom.'
			);
		if (route.maxTo.lte(route.minTo))
			throw new BadRequestException('maxTo must be greater than minTo.');

		// TODO: Validate rate compatibility when Parser infrastructure is ready

		try {
			const updated = await this.route.save(route);

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
		const route = await this.route.findOne({
			where: { id },
			relations: ['manualMerchant']
		});
		if (!route) throw new NotFoundException('Route not found.');

		const manualMerchantId = route.manualMerchant?.id;

		await this.route.remove(route);

		if (manualMerchantId)
			await this.merchantService.deleteManualMerchant(manualMerchantId);
	}

	async getOne(id: number) {
		const route = await this.route.findOne({
			where: { id },
			relations: [
				'fromCurrency',
				'toCurrency',
				'parser',
				'payout',
				'merchant',
				'manualMerchant',
				'depositAml',
				'withdrawAml'
			]
		});
		if (!route) throw new NotFoundException('Route not found.');
		return route;
	}

	async deactivateRoutesByCurrencies(currencyIds: number[]) {
		if (!currencyIds.length) return;
		await this.route
			.createQueryBuilder()
			.update(Route)
			.set({ active: false })
			.where('"fromCurrency" IN (:...ids)', { ids: currencyIds })
			.orWhere('"toCurrency" IN (:...ids)', { ids: currencyIds })
			.execute();

		console.log(
			`[RouteService] Deactivated routes using currencies: ${currencyIds.join(', ')}`
		);
	}

	async deactivateRoutesByPlugin(type: PluginType, id: number) {
		switch (type) {
			case PluginType.PARSER:
				await this.route.update(
					{
						parser: { id }
					},
					{ parser: null, active: false }
				);
				break;
			case PluginType.PAYOUT:
				await this.route.update(
					{
						payout: { id },
						payoutBinding: PayoutBinding.EXPLICIT
					},
					{ payout: null, active: false }
				);
				break;
			case PluginType.MERCHANT:
				await this.route.update(
					{
						merchant: { id },
						merchantBinding: RouteMerchantBinding.EXPLICIT
					},
					{ merchant: null, active: false }
				);
				break;
			case PluginType.AML:
				await this.route.update(
					{
						depositAml: { id },
						depositAmlBinding: AmlBinding.EXPLICIT
					},
					{ depositAml: null, active: false }
				);

				await this.route.update(
					{
						withdrawAml: { id },
						withdrawAmlBinding: AmlBinding.EXPLICIT
					},
					{ withdrawAml: null, active: false }
				);
				break;
			default:
				break;
		}

		console.log(
			`[RouteService] Deactivated routes due to ${type} plugin #${id} failure;`
		);
	}

	async removeRoutesByCurrency(currencyId: number) {
		const routes = await this.route.find({
			where: [
				{
					fromCurrency: {
						id: currencyId
					}
				},
				{
					toCurrency: {
						id: currencyId
					}
				}
			],
			relations: ['manualMerchant']
		});

		if (!routes.length) return;

		const manualMerchantIds: number[] = [];
		for (const route of routes) {
			if (route.manualMerchant?.id)
				manualMerchantIds.push(route.manualMerchant.id);
		}

		await this.route.remove(routes);

		for (const id of manualMerchantIds) {
			await this.merchantService.deleteManualMerchant(id);
		}

		console.log(
			`[RouteService] Removed ${routes.length} routes using currency #${currencyId}`
		);
	}
}
