import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { In, Not, Repository } from 'typeorm';
import { OrderEvent } from './entities/order-event.entity';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';
import { IdentityService } from '../identity/identity.service';
import { CurrencyService } from '../currency/currency.service';
import { RouteService } from '../route/route.service';
import { MerchantService } from '../merchant/merchant.service';
import { ParserService } from '../parser/parser.service';
import { AmlService } from '../aml/aml.service';
import {
	ActorType,
	CurrencyMerchantBinding,
	type Field,
	FormValue,
	type MerchantWebhookResponse,
	OrderEventType,
	type OrderSseEvent,
	OrderStateMachine,
	OrderStatus,
	PaymentDetailsReponse,
	PayoutBinding,
	type PayoutWebhookResponse,
	PrincipalType,
	RouteMerchantBinding,
	type RouteSnapshot,
	SessionContext,
	Validators
} from '@exchange-core/common';
import Decimal from 'decimal.js';
import { Principal } from '../identity/entities/principal.entity';
import { ConfigService } from '@nestjs/config';
import { PayoutService } from '../payout/payout.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Merchant } from '../merchant/entities/merchant.entity';
import { Payout } from '../payout/entities/payout.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { fromEvent, map, Observable } from 'rxjs';
import { Staff } from '../staff/entities/staff.entity';
import { Currency } from '../currency/entities/currency.entity';
import { Session } from '../identity/entities/session.entity';

@Injectable()
export class OrderService {
	constructor(
		@InjectRepository(Order) private readonly order: Repository<Order>,
		@InjectRepository(OrderEvent)
		private readonly orderEvent: Repository<OrderEvent>,
		private readonly identity: IdentityService,
		@Inject(forwardRef(() => CurrencyService))
		private readonly currencyService: CurrencyService,
		@Inject(forwardRef(() => RouteService))
		private readonly routeService: RouteService,
		@Inject(forwardRef(() => MerchantService))
		private readonly merchantService: MerchantService,
		@Inject(forwardRef(() => PayoutService))
		private readonly payoutService: PayoutService,
		private readonly parserService: ParserService,
		private readonly amlService: AmlService,
		private readonly cfg: ConfigService,
		private readonly emitter: EventEmitter2,
		private readonly schedulerRegistry: SchedulerRegistry
	) {}

	async create(dto: CreateOrderDto, ctx: SessionContext) {
		if (dto.amountFrom == undefined && dto.amountTo == undefined)
			throw new BadRequestException(
				'amountFrom or amountTo is required.'
			);

		const route = await this.routeService.getOne(dto.routeId);
		if (!route.active)
			throw new BadRequestException('Route is not active.');

		const fromCurrency = await this.currencyService.getOne(
			route.fromCurrency.id
		);
		const toCurrency = await this.currencyService.getOne(
			route.toCurrency.id
		);

		const sourceRate = await this.parserService.getRate(
			route.parser!.id,
			route.fromCurrencyParser,
			route.toCurrencyParser
		);

		const rate = sourceRate
			.minus(sourceRate.mul(route.commissionPercentage.div(100)))
			.minus(sourceRate.mul(route.lossPercentage.div(100)))
			.minus(route.commissionAmount)
			.minus(route.lossAmount);

		let amountFrom: Decimal, amountTo: Decimal;

		if (dto.amountFrom) {
			amountFrom = dto.amountFrom;
			amountTo = amountFrom.mul(rate);
		} else {
			amountTo = dto.amountTo!;
			amountFrom = amountTo.mul(new Decimal(1).div(rate));
		}

		if (amountFrom.lt(route.minFrom) || amountFrom.gt(route.maxFrom))
			throw new BadRequestException('Amount from is out of range.');
		if (amountTo.lt(route.minTo) || amountTo.gt(route.maxTo))
			throw new BadRequestException('Amount to is out of range.');

		const depositCurrency = dto.formValues.deposit.filter(
			(v) => v.source === 'currency'
		);
		const depositPlugin = dto.formValues.deposit.filter(
			(v) => v.source === 'plugin'
		);

		const withdrawCurrency = dto.formValues.withdraw.filter(
			(v) => v.source === 'currency'
		);
		const withdrawPlugin = dto.formValues.withdraw.filter(
			(v) => v.source === 'plugin'
		);

		const extra = dto.formValues.extra;

		let merchant: Merchant | null | undefined = undefined;
		const merchantBinding = route.merchantBinding;

		if (merchantBinding !== RouteMerchantBinding.MANUAL) {
			if (merchantBinding === RouteMerchantBinding.EXPLICIT) {
				merchant = route.merchant;
			} else if (merchantBinding === RouteMerchantBinding.DEFAULT) {
				const currencyMerchantBinding = fromCurrency.merchantBinding;
				if (
					currencyMerchantBinding !== CurrencyMerchantBinding.MANUAL
				) {
					merchant = fromCurrency.merchant;
				}
			}
		}

		let merchantRequiredFields: Field[] | undefined = undefined;
		if (merchant) {
			try {
				merchantRequiredFields = await this.merchantService.getFields(
					merchant.id,
					fromCurrency.code.code
				);
			} catch (err) {
				throw new InternalServerErrorException(err.message);
			}
		}

		let payout: Payout | null | undefined = undefined;
		const payoutBinding = route.payoutBinding;

		if (payoutBinding !== PayoutBinding.NONE) {
			if (payoutBinding === PayoutBinding.EXPLICIT) {
				payout = route.payout;
			} else if (payoutBinding === PayoutBinding.DEFAULT) {
				payout = toCurrency.payout;
			}
		}

		let payoutRequiredFields: Field[] | undefined = undefined;
		if (payout) {
			try {
				payoutRequiredFields = await this.payoutService.getFields(
					payout.id,
					toCurrency.code.code
				);
			} catch (err) {
				throw new InternalServerErrorException(err.message);
			}
		}

		this.validateFormFields(depositCurrency, fromCurrency.depositFields);
		this.validateFormFields(withdrawCurrency, toCurrency.withdrawFields);
		this.validateFormFields(extra, route.extraFields);

		if (merchantRequiredFields)
			this.validateFormFields(depositPlugin, merchantRequiredFields);
		if (payoutRequiredFields)
			this.validateFormFields(withdrawPlugin, payoutRequiredFields);

		const profit = amountFrom
			.mul(sourceRate)
			.minus(amountFrom.mul(rate))
			.minus(route.lossAmount)
			.minus(route.lossPercentage.mul(sourceRate).div(100));

		const routeSnapshot: RouteSnapshot = {
			fromCurrency: {
				name: fromCurrency.name,
				ticker: fromCurrency.ticker
			},
			toCurrency: {
				name: toCurrency.name,
				ticker: toCurrency.ticker
			}
		};

		let principal: Principal;
		if (!dto.principalId) {
			principal = await this.identity.createPrincipal(
				PrincipalType.GUEST
			);
			await this.identity.createSession(
				PrincipalType.GUEST,
				principal.id,
				ctx
			);
		} else {
			principal = await this.identity.getPrincipal(dto.principalId);
		}

		const order = await this.order.save(
			this.order.create({
				amountFrom,
				amountTo,
				profit,
				status: OrderStatus.NEW,
				rateFromTo: rate,
				formValues: dto.formValues,
				routeSnapshot,
				route,
				principal
			})
		);

		await this.orderEvent.save(
			this.orderEvent.create({
				type: OrderEventType.STATUS_CHANGED,
				actorType: ActorType.SYSTEM,
				toStatus: OrderStatus.NEW,
				order: order
			})
		);

		order.expiresAt = new Date(Date.now() + route.orderLifetimeMs);
		this.createOrderTimer(order.id, route.orderLifetimeMs);

		return order;
	}

	subscribe(id: number): Observable<OrderSseEvent> {
		return fromEvent<OrderSseEvent>(
			this.emitter,
			`order.${id}.changed`
		).pipe(
			map((data) => {
				console.log('Event:', data);
				return data;
			})
		);
	}

	async confirm(id: number) {
		const order = await this.order.findOne({
			where: { id },
			relations: [
				'route',
				'route.fromCurrency',
				'route.toCurrency',
				'route.merchant',
				'route.manualMerchant',
				'route.payout',
				'principal'
			]
		});

		if (!order) throw new NotFoundException('Order not found.');
		if (order.status !== OrderStatus.NEW) {
			throw new BadRequestException(
				'Order already confirmed or expired.'
			);
		}

		if (!order.route)
			throw new BadRequestException('Cannot confirm: route was deleted.');
		if (!order.route.active)
			throw new BadRequestException('Cannot confirm: route is inactive.');

		order.url = `${this.cfg.getOrThrow<string>('FRONTEND_URL')}/orders/${order.id}`;

		const paymentDetails = await this.getPaymentDetailsForOrder(order);
		if (!paymentDetails)
			throw new BadRequestException(
				'Failed to get payment details. Order moved to HOLD.'
			);

		order.status = OrderStatus.NOT_PAID;

		await this.order.save(order);

		await this.orderEvent.save(
			this.orderEvent.create({
				type: OrderEventType.STATUS_CHANGED,
				actorType: ActorType.SYSTEM,
				fromStatus: OrderStatus.NEW,
				toStatus: OrderStatus.NOT_PAID,
				order: order
			})
		);

		this.emitter.emit(`order.${id}.changed`, {
			status: order.status,
			paymentDetails
		} as OrderSseEvent);
	}

	async update(id: number, dto: UpdateOrderDto, staff: Staff) {
		const order = await this.order.findOne({
			where: { id },
			relations: [
				'route',
				'route.fromCurrency',
				'route.toCurrency',
				'route.merchant',
				'route.payout',
				'route.manualMerchant',
				'staff'
			]
		});
		if (!order) throw new NotFoundException('Order not found.');

		if (!order.route)
			throw new BadRequestException(
				'Cannot modify order: route was deleted. Order is locked.'
			);

		const operationsCount = [
			dto.managerId !== undefined,
			dto.status !== undefined,
			dto.comment !== undefined
		].filter(Boolean).length;
		if (operationsCount > 1)
			throw new BadRequestException(
				'Only one operation allowed per request.'
			);

		if (dto.managerId !== undefined) {
			if (order.staff === null) {
				order.staff = staff;
				await this.order.save(order);

				await this.orderEvent.save(
					this.orderEvent.create({
						type: OrderEventType.MANAGER_ASSIGNED,
						actorType: ActorType.EMPLOYEE,
						order,
						staff
					})
				);
			} else {
				if (order.staff?.id !== staff.id) {
					throw new BadRequestException(
						'Only the assigned manager can release themselves.'
					);
				}

				const releasedStaff = order.staff;
				order.staff = null;
				await this.order.save(order);

				await this.orderEvent.save(
					this.orderEvent.create({
						type: OrderEventType.MANAGER_RELEASED,
						actorType: ActorType.EMPLOYEE,
						order,
						staff: releasedStaff
					})
				);
			}
		}

		if (dto.status !== undefined || dto.comment !== undefined) {
			if (!order.staff) {
				throw new BadRequestException(
					'Order must have an assigned manager to modify status or add comments.'
				);
			}
			if (order.staff.id !== staff.id) {
				throw new BadRequestException(
					'Only the assigned manager can modify this order.'
				);
			}
		}

		if (dto.status !== undefined) {
			const allowedTransitions = OrderStateMachine[order.status];
			if (!allowedTransitions.includes(dto.status)) {
				throw new BadRequestException(
					`Cannot transition from ${order.status} to ${dto.status}.`
				);
			}

			if (!order.route.active) {
				if (order.status === OrderStatus.HOLD) {
					const terminalStatuses = [
						OrderStatus.SUCCESS,
						OrderStatus.RETURNED,
						OrderStatus.DELETED
					];

					if (!terminalStatuses.includes(dto.status))
						throw new BadRequestException(
							'Route is inactive. From HOLD you can only move to SUCCESS, DELETED, or RETURNED. To move to PROCESSING, activate the route first.'
						);
				} else {
					throw new BadRequestException(
						'Cannot change status due to route unavailability. Order is locked.'
					);
				}
			}

			const previousStatus = order.status;

			if (
				(previousStatus === OrderStatus.NEW ||
					previousStatus === OrderStatus.NOT_PAID) &&
				dto.status !== OrderStatus.NEW &&
				dto.status !== OrderStatus.NOT_PAID
			) {
				order.expiresAt = null;
				this.deleteOrderTimer(id);
			}

			let paymentDetails: PaymentDetailsReponse | null = null;

			if (dto.status === OrderStatus.NOT_PAID) {
				paymentDetails = await this.getPaymentDetailsForOrder(order);
				if (!paymentDetails)
					throw new BadRequestException(
						'Failed to get payment details. Order moved to HOLD.'
					);

				order.expiresAt = new Date(
					Date.now() + order.route.orderLifetimeMs
				);
				this.createOrderTimer(id, order.route.orderLifetimeMs);
			}

			if (dto.status === OrderStatus.IN_PAYOUT) {
				this.startTransfer(order.id).catch((err) =>
					console.log(
						`[OrderService] Unexpected error in startTransfer for order #${order.id}:`,
						err
					)
				);
				if (order.payoutTxId !== null) {
					const toCurrency = await this.currencyService.getOne(
						order.route.toCurrency.id
					);

					let payout: Payout | null | undefined;
					if (order.route.payoutBinding === PayoutBinding.EXPLICIT) {
						payout = order.route.payout;
					} else if (
						order.route.payoutBinding === PayoutBinding.DEFAULT
					) {
						payout = toCurrency.payout;
					}

					if (payout && !payout.manifest.webhook?.supported)
						this.startPayoutPolling(
							order.id,
							payout.id,
							order.payoutTxId
						);
				}
			} else if (previousStatus === OrderStatus.IN_PAYOUT) {
				this.stopPayoutPolling(order.id);
			}

			order.status = dto.status;
			await this.order.save(order);

			await this.orderEvent.save(
				this.orderEvent.create({
					type: OrderEventType.STATUS_CHANGED,
					actorType: ActorType.EMPLOYEE,
					fromStatus: previousStatus,
					toStatus: dto.status,
					order,
					staff
				})
			);

			this.emitter.emit(`order.${id}.changed`, {
				status: dto.status,
				paymentDetails: paymentDetails || undefined
			} as OrderSseEvent);

			return order;
		}

		if (dto.comment !== undefined) {
			await this.orderEvent.save(
				this.orderEvent.create({
					type: OrderEventType.COMMENT_ADDED,
					actorType: ActorType.EMPLOYEE,
					commentText: dto.comment,
					order,
					staff
				})
			);
		}
		return order;
	}

	async getOne(id: number) {
		const order = await this.order.findOne({
			where: { id },
			relations: ['route']
		});
		if (!order) throw new NotFoundException('Order not found.');
		return order;
	}

	async getOneForStaff(id: number) {
		const order = await this.order.findOne({
			where: { id },
			relations: ['staff', 'principal']
		});
		if (!order) throw new NotFoundException('Order not found.');

		let session: Session | null = null;
		if (order.principal) {
			session = await this.identity.getLatestSession(order.principal.id);
		}

		return {
			...order,
			client:
				order.principal && session
					? {
							type: order.principal.type,
							ip: session.ip,
							ua: session.ua
						}
					: null
		};
	}

	async getEvents(orderId: number) {
		const order = await this.order.findOne({ where: { id: orderId } });
		if (!order) throw new NotFoundException('Order not found.');

		const events = await this.orderEvent.find({
			where: { order: { id: orderId } },
			relations: ['staff'],
			order: { createdAt: 'DESC' }
		});

		return events;
	}

	async getList(
		page: number,
		limit: number,
		status?: OrderStatus[],
		search?: string
	) {
		const queryBuilder = this.order
			.createQueryBuilder('order')
			.leftJoinAndSelect('order.staff', 'staff');

		if (status && status.length > 0) {
			queryBuilder.where('order.status IN (:...status)', { status });
		}

		if (search && search.trim()) {
			const searchTerm = `%${search.trim()}%`;
			queryBuilder.andWhere(
				'(CAST(order.id AS TEXT) LIKE :search OR ' +
					'LOWER(staff.email) LIKE LOWER(:search) OR ' +
					'LOWER("order"."routeSnapshot"->\'fromCurrency\'->>\'name\') LIKE LOWER(:search) OR ' +
					'LOWER("order"."routeSnapshot"->\'fromCurrency\'->>\'ticker\') LIKE LOWER(:search) OR ' +
					'LOWER("order"."routeSnapshot"->\'toCurrency\'->>\'name\') LIKE LOWER(:search) OR ' +
					'LOWER("order"."routeSnapshot"->\'toCurrency\'->>\'ticker\') LIKE LOWER(:search))',
				{ search: searchTerm }
			);
		}

		const total = await queryBuilder.getCount();

		queryBuilder
			.skip((page - 1) * limit)
			.take(limit)
			.orderBy('order.createdAt', 'DESC');

		const orders = await queryBuilder.getMany();

		return {
			data: orders,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit)
		};
	}

	@OnEvent('merchant.webhook', { async: true })
	async handleMerchantWebhook(payload: MerchantWebhookResponse) {
		const order = await this.order.findOne({
			where: {
				merchantIdentifier: payload.identifier
			}
		});
		if (!order) {
			console.log(
				`[OrderService] Order not found for identifier: ${payload.identifier}`
			);
			return;
		}

		const ignoreStatuses = [
			OrderStatus.ERROR_PAID,
			OrderStatus.ERROR_PAYOUT,
			OrderStatus.IN_PAYOUT,
			OrderStatus.HOLD,
			OrderStatus.SUCCESS,
			OrderStatus.RETURNED,
			OrderStatus.DELETED
		];

		if (ignoreStatuses.includes(order.status)) return;

		if (
			order.status === OrderStatus.NEW ||
			order.status === OrderStatus.NOT_PAID
		) {
			order.expiresAt = null;
			this.deleteOrderTimer(order.id);
		}

		if (
			order.status === OrderStatus.NOT_PAID &&
			payload.status === OrderStatus.IN_PAYOUT
		) {
			const previousStatus = order.status;
			order.status = OrderStatus.HOLD;
			await this.order.save(order);

			await this.orderEvent.save(
				this.orderEvent.create({
					type: OrderEventType.STATUS_CHANGED,
					actorType: ActorType.SYSTEM,
					fromStatus: previousStatus,
					toStatus: OrderStatus.HOLD,
					order
				})
			);

			this.emitter.emit(`order.${order.id}.changed`, {
				status: OrderStatus.HOLD
			} as OrderSseEvent);

			return;
		}

		const amount = new Decimal(payload.amount);

		const expectedAmount = order.amountFrom;
		if (
			!expectedAmount.equals(amount) ||
			payload.status === OrderStatus.ERROR_PAID
		) {
			const previousStatus = order.status;
			order.status = OrderStatus.ERROR_PAID;
			await this.order.save(order);

			await this.orderEvent.save(
				this.orderEvent.create({
					type: OrderEventType.STATUS_CHANGED,
					actorType: ActorType.SYSTEM,
					fromStatus: previousStatus,
					toStatus: OrderStatus.ERROR_PAID,
					order
				})
			);

			this.emitter.emit(`order.${order.id}.changed`, {
				status: OrderStatus.ERROR_PAID
			} as OrderSseEvent);

			return;
		}

		const previousStatus = order.status;
		order.status = payload.status;

		await this.order.save(order);

		await this.orderEvent.save(
			this.orderEvent.create({
				type: OrderEventType.STATUS_CHANGED,
				actorType: ActorType.SYSTEM,
				fromStatus: previousStatus,
				toStatus: payload.status,
				order
			})
		);

		const event: OrderSseEvent = { status: payload.status };
		if (payload.status === OrderStatus.PROCESSING)
			event.confirmations = payload.confirmations;

		this.emitter.emit(`order.${order.id}.changed`, event);

		if (payload.status === OrderStatus.IN_PAYOUT)
			this.startTransfer(order.id).catch((err) =>
				console.log(
					`[OrderService] Unexpected error in startTransfer for order #${order.id}:`,
					err
				)
			);
	}

	@OnEvent('payout.webhook', { async: true })
	async handlePayoutWebhook(payload: PayoutWebhookResponse) {
		const order = await this.order.findOne({
			where: { payoutTxId: payload.txId }
		});
		if (!order) {
			console.warn(
				`[OrderService] Order not found for payout txId: ${payload.txId}`
			);
			return;
		}

		const ignoreStatuses = [
			OrderStatus.ERROR_PAYOUT,
			OrderStatus.HOLD,
			OrderStatus.SUCCESS,
			OrderStatus.RETURNED,
			OrderStatus.DELETED
		];

		if (ignoreStatuses.includes(order.status)) return;

		const previousStatus = order.status;

		if (order.status === OrderStatus.IN_PAYOUT) {
			order.status = payload.status;
			await this.order.save(order);

			await this.orderEvent.save(
				this.orderEvent.create({
					type: OrderEventType.STATUS_CHANGED,
					actorType: ActorType.SYSTEM,
					fromStatus: previousStatus,
					toStatus: payload.status,
					order
				})
			);

			this.emitter.emit(`order.${order.id}.changed`, {
				status: payload.status
			} as OrderSseEvent);

			return;
		}

		if (
			previousStatus === OrderStatus.NEW ||
			previousStatus === OrderStatus.NOT_PAID
		) {
			order.expiresAt = null;
			this.deleteOrderTimer(order.id);
		}

		order.status = OrderStatus.HOLD;
		await this.order.save(order);

		await this.orderEvent.save(
			this.orderEvent.create({
				type: OrderEventType.STATUS_CHANGED,
				actorType: ActorType.SYSTEM,
				fromStatus: previousStatus,
				toStatus: OrderStatus.HOLD,
				order
			})
		);

		this.emitter.emit(`order.${order.id}.changed`, {
			status: OrderStatus.HOLD
		} as OrderSseEvent);
	}

	private async getPaymentDetailsForOrder(order: Order) {
		if (!order.route) return null;

		if (order.paymentDetails) return order.paymentDetails;

		const fromCurrency = await this.currencyService.getOne(
			order.route.fromCurrency.id
		);

		let merchant: Merchant | null | undefined = undefined;
		if (order.route.merchantBinding === RouteMerchantBinding.EXPLICIT) {
			merchant = order.route.merchant;
		} else if (
			order.route.merchantBinding === RouteMerchantBinding.DEFAULT
		) {
			if (fromCurrency.merchantBinding !== CurrencyMerchantBinding.MANUAL)
				merchant = fromCurrency.merchant;
		}

		const manualMerchant =
			order.route.manualMerchant ||
			(order.route.merchantBinding === RouteMerchantBinding.DEFAULT
				? fromCurrency.manualMerchant
				: null);

		if (merchant) {
			let merchantFields: Field[] = [];
			try {
				merchantFields = await this.merchantService.getFields(
					merchant.id,
					fromCurrency.code.code
				);
			} catch {
				order.expiresAt = null;
				this.deleteOrderTimer(order.id);

				const previousStatus = order.status;
				order.status = OrderStatus.HOLD;

				await this.order.save(order);

				await this.orderEvent.save(
					this.orderEvent.create({
						type: OrderEventType.STATUS_CHANGED,
						actorType: ActorType.SYSTEM,
						fromStatus: previousStatus,
						toStatus: OrderStatus.HOLD,
						order
					})
				);

				this.emitter.emit(`order.${order.id}.changed`, {
					status: order.status
				} as OrderSseEvent);

				return null;
			}

			const labelToId = new Map(
				merchantFields.map((f) => [f.label, f.id!])
			);

			const depositPluginArgs = order.formValues.deposit
				.filter((v) => v.source === 'plugin')
				.reduce(
					(acc, v) => {
						const fieldId = labelToId.get(v.label);
						if (fieldId) acc[fieldId] = v.value;
						return acc;
					},
					{} as Record<string, string>
				);

			try {
				const paymentDetails =
					await this.merchantService.getPaymentDetails(
						merchant.id,
						fromCurrency.code.code,
						depositPluginArgs
					);

				const existing = await this.order.findOne({
					where: { merchantIdentifier: paymentDetails.identifier }
				});
				if (existing) {
					await this.merchantService.disable(merchant.id);
					throw new Error();
				}

				order.merchantIdentifier = paymentDetails.identifier;
				order.paymentDetails = paymentDetails;
				return paymentDetails;
			} catch {
				order.expiresAt = null;
				this.deleteOrderTimer(order.id);

				const previousStatus = order.status;
				order.status = OrderStatus.HOLD;

				await this.order.save(order);

				await this.orderEvent.save(
					this.orderEvent.create({
						type: OrderEventType.STATUS_CHANGED,
						actorType: ActorType.SYSTEM,
						fromStatus: previousStatus,
						toStatus: OrderStatus.HOLD,
						order
					})
				);

				this.emitter.emit(`order.${order.id}.changed`, {
					status: order.status
				} as OrderSseEvent);

				return null;
			}
		} else if (manualMerchant) {
			const paymentDetails: PaymentDetailsReponse = {
				identifier: 'manual',
				details: [
					{
						label: 'Payment System',
						value: manualMerchant.paymentSystem
					},
					{
						label: 'Payment Account',
						value: manualMerchant.paymentAccount
					},
					...(manualMerchant.comment
						? [{ label: 'Comment', value: manualMerchant.comment }]
						: [])
				]
			};

			order.paymentDetails = paymentDetails;

			return paymentDetails;
		}
		throw new InternalServerErrorException(
			'No merchant configured for this route.'
		);
	}

	private validateFormFields(
		formValues: FormValue[],
		expectedFields: Field[]
	) {
		const formValueMap = new Map(
			formValues.map((fv) => [fv.label, fv.value])
		);

		for (const field of expectedFields) {
			const value = formValueMap.get(field.label);

			if (value === undefined) {
				throw new BadRequestException(
					`Missing required field: ${field.label}`
				);
			}

			if (typeof field.validator === 'string') {
				const enumValidator = Validators[field.validator];
				if (enumValidator) {
					if (!enumValidator(value))
						throw new BadRequestException(
							`Invalid value for field "${field.label}": ${field.hint}`
						);
				} else {
					try {
						const regexValidator = new RegExp(field.validator);
						if (!regexValidator.test(value)) {
							throw new Error();
						}
					} catch {
						throw new BadRequestException(
							`Invalid validator for field "${field.label}"`
						);
					}
				}
			}
		}
	}

	private createOrderTimer(orderId: number, lifetimeMs: number) {
		const timerName = `order-${orderId}`;

		const timeout = setTimeout(async () => {
			try {
				const order = await this.order.findOne({
					where: { id: orderId }
				});
				if (
					order &&
					(order.status === OrderStatus.NEW ||
						order.status === OrderStatus.NOT_PAID)
				) {
					const previousStatus = order.status;

					order.expiresAt = null;

					order.status = OrderStatus.DELETED;
					await this.order.save(order);

					await this.orderEvent.save(
						this.orderEvent.create({
							type: OrderEventType.STATUS_CHANGED,
							actorType: ActorType.SYSTEM,
							fromStatus: previousStatus,
							toStatus: OrderStatus.DELETED,
							order
						})
					);

					this.emitter.emit(`order.${orderId}.changed`, {
						status: OrderStatus.DELETED
					} as OrderSseEvent);

					console.log(
						`[OrderService] Order #${orderId} expired and marked as DELETED`
					);
				}
			} catch (err) {
				console.error(
					`[OrderService] Failed to expire order #${orderId}:`,
					err
				);
			} finally {
				this.deleteOrderTimer(orderId);
			}
		}, lifetimeMs);

		this.schedulerRegistry.addTimeout(timerName, timeout);
	}

	private deleteOrderTimer(orderId: number) {
		const timerName = `order-${orderId}`;
		try {
			this.schedulerRegistry.deleteTimeout(timerName);
		} catch {}
	}

	async handleRouteDeactivation(routeId: number) {
		const orders = await this.order.find({
			where: {
				route: { id: routeId },
				status: Not(
					In([
						OrderStatus.SUCCESS,
						OrderStatus.DELETED,
						OrderStatus.RETURNED,
						OrderStatus.HOLD
					])
				)
			}
		});

		for (const order of orders) {
			await this.handleOrderOnRouteDeactivation(order);
		}
	}

	private async handleOrderOnRouteDeactivation(order: Order) {
		const previousStatus = order.status;
		let newStatus: OrderStatus;

		switch (order.status) {
			case OrderStatus.NEW:
				newStatus = OrderStatus.DELETED;
				break;

			case OrderStatus.NOT_PAID:
			case OrderStatus.PROCESSING:
			case OrderStatus.IN_PAYOUT:
			case OrderStatus.ERROR_PAID:
			case OrderStatus.ERROR_PAYOUT:
				newStatus = OrderStatus.HOLD;
				break;

			default:
				return;
		}

		order.expiresAt = null;
		this.deleteOrderTimer(order.id);

		this.stopPayoutPolling(order.id);

		order.status = newStatus;
		await this.order.save(order);

		await this.orderEvent.save(
			this.orderEvent.create({
				type: OrderEventType.STATUS_CHANGED,
				actorType: ActorType.SYSTEM,
				fromStatus: previousStatus,
				toStatus: newStatus,
				order
			})
		);

		this.emitter.emit(`order.${order.id}.changed`, {
			status: newStatus
		} as OrderSseEvent);
	}

	async hasActiveOrdersByRoute(routeId: number) {
		const count = await this.order.count({
			where: {
				route: { id: routeId },
				status: Not(
					In([
						OrderStatus.SUCCESS,
						OrderStatus.DELETED,
						OrderStatus.RETURNED
					])
				)
			}
		});

		return count > 0;
	}

	private async startTransfer(id: number) {
		const result = await this.order.update(
			{ id, isInPayoutProcess: false },
			{ isInPayoutProcess: true }
		);
		if (result.affected === 0) return;

		const order = await this.order.findOne({
			where: { id },
			relations: ['route', 'route.payout', 'route.toCurrency']
		});

		if (!order || order.payoutTxId !== null || !order.route) {
			await this.order.update(
				{ id, isInPayoutProcess: true },
				{ isInPayoutProcess: false }
			);
			return;
		}

		let toCurrency: Currency;
		try {
			toCurrency = await this.currencyService.getOne(
				order.route.toCurrency.id
			);
		} catch {
			await this.order.update(
				{ id, isInPayoutProcess: true },
				{ isInPayoutProcess: false }
			);
			return;
		}

		let payout: Payout | null | undefined = null;
		if (order.route.payoutBinding === PayoutBinding.EXPLICIT) {
			payout = order.route.payout;
		} else if (order.route.payoutBinding === PayoutBinding.DEFAULT) {
			payout = toCurrency.payout;
		}

		if (!payout) {
			await this.order.update(
				{ id, isInPayoutProcess: true },
				{ isInPayoutProcess: false }
			);
			return;
		}

		let fields: Field[];
		try {
			fields = await this.payoutService.getFields(
				payout.id,
				toCurrency.code.code
			);
		} catch {
			const previousStatus = order.status;

			order.status = OrderStatus.ERROR_PAYOUT;
			order.isInPayoutProcess = false;

			await this.order.save(order);

			await this.orderEvent.save(
				this.orderEvent.create({
					type: OrderEventType.STATUS_CHANGED,
					actorType: ActorType.SYSTEM,
					fromStatus: previousStatus,
					toStatus: OrderStatus.ERROR_PAYOUT,
					order
				})
			);

			this.emitter.emit(`order.${order.id}.changed`, {
				status: OrderStatus.ERROR_PAYOUT
			} as OrderSseEvent);

			return;
		}

		const labelToId = new Map(fields.map((f) => [f.label, f.id!]));

		const withdrawPluginArgs = order.formValues.withdraw
			.filter((v) => v.source === 'plugin')
			.reduce(
				(acc, v) => {
					const fieldId = labelToId.get(v.label);
					if (fieldId) acc[fieldId] = v.value;
					return acc;
				},
				{} as Record<string, string>
			);

		let txId: string;
		try {
			txId = await this.payoutService.transfer(
				payout.id,
				toCurrency.code.code,
				order.amountTo,
				withdrawPluginArgs
			);
		} catch {
			const previousStatus = order.status;

			order.status = OrderStatus.ERROR_PAYOUT;
			order.isInPayoutProcess = false;

			await this.order.save(order);

			await this.orderEvent.save(
				this.orderEvent.create({
					type: OrderEventType.STATUS_CHANGED,
					actorType: ActorType.SYSTEM,
					fromStatus: previousStatus,
					toStatus: OrderStatus.ERROR_PAYOUT,
					order
				})
			);

			this.emitter.emit(`order.${order.id}.changed`, {
				status: OrderStatus.ERROR_PAYOUT
			} as OrderSseEvent);

			return;
		}

		const existing = await this.order.findOne({
			where: { payoutTxId: txId }
		});
		if (existing) {
			await this.payoutService.disable(payout.id);
			return;
		}

		try {
			order.payoutTxId = txId;
			order.isInPayoutProcess = false;

			await this.order.save(order);

			console.log(
				`[OrderService] Transfer completed for order #${order.id}, txId: ${txId}`
			);
		} catch {
			console.error(
				`CRITICAL: Order #${order.id} transfer completed but txId not saved: ${txId}`
			);

			const previousStatus = order.status;

			order.status = OrderStatus.ERROR_PAYOUT;
			order.isInPayoutProcess = false;

			await this.order.save(order);

			await this.orderEvent.save(
				this.orderEvent.create({
					type: OrderEventType.STATUS_CHANGED,
					actorType: ActorType.SYSTEM,
					fromStatus: previousStatus,
					toStatus: OrderStatus.ERROR_PAYOUT,
					order
				})
			);

			this.emitter.emit(`order.${order.id}.changed`, {
				status: OrderStatus.ERROR_PAYOUT
			} as OrderSseEvent);
		}

		if (!payout.manifest.webhook?.supported)
			this.startPayoutPolling(order.id, payout.id, txId);
	}

	private startPayoutPolling(
		orderId: number,
		payoutId: number,
		txId: string
	) {
		const intervalName = `payout-poll-${orderId}`;
		const timeoutName = `payout-timeout-${orderId}`;

		const interval = setInterval(async () => {
			try {
				const status = await this.payoutService.checkStatus(
					payoutId,
					txId
				);
				if (status !== OrderStatus.IN_PAYOUT) {
					this.stopPayoutPolling(orderId);

					const order = await this.order.findOne({
						where: { id: orderId }
					});
					if (!order || order.status !== OrderStatus.IN_PAYOUT)
						return;

					const previousStatus = order.status;
					order.status = status;
					await this.order.save(order);

					await this.orderEvent.save(
						this.orderEvent.create({
							type: OrderEventType.STATUS_CHANGED,
							actorType: ActorType.SYSTEM,
							fromStatus: previousStatus,
							toStatus: status,
							order
						})
					);

					this.emitter.emit(`order.${order.id}.changed`, {
						status
					} as OrderSseEvent);
				}
			} catch {
				this.stopPayoutPolling(orderId);

				const order = await this.order.findOne({
					where: { id: orderId }
				});
				if (!order || order.status !== OrderStatus.IN_PAYOUT) return;

				const previousStatus = order.status;
				order.status = OrderStatus.ERROR_PAYOUT;
				await this.order.save(order);

				await this.orderEvent.save(
					this.orderEvent.create({
						type: OrderEventType.STATUS_CHANGED,
						actorType: ActorType.SYSTEM,
						fromStatus: previousStatus,
						toStatus: OrderStatus.ERROR_PAYOUT,
						order
					})
				);

				this.emitter.emit(`order.${order.id}.changed`, {
					status: OrderStatus.ERROR_PAYOUT
				} as OrderSseEvent);
			}
		}, 30000);

		this.schedulerRegistry.addInterval(intervalName, interval);

		const timeout = setTimeout(async () => {
			this.stopPayoutPolling(orderId);

			const order = await this.order.findOne({ where: { id: orderId } });
			if (order && order.status === OrderStatus.IN_PAYOUT) {
				const previousStatus = order.status;

				order.status = OrderStatus.ERROR_PAYOUT;
				await this.order.save(order);

				await this.orderEvent.save(
					this.orderEvent.create({
						type: OrderEventType.STATUS_CHANGED,
						actorType: ActorType.SYSTEM,
						fromStatus: previousStatus,
						toStatus: OrderStatus.ERROR_PAYOUT,
						order
					})
				);

				this.emitter.emit(`order.${order.id}.changed`, {
					status: OrderStatus.ERROR_PAYOUT
				} as OrderSseEvent);
			}
		}, 3600000);

		this.schedulerRegistry.addTimeout(timeoutName, timeout);
	}

	private stopPayoutPolling(orderId: number) {
		const intervalName = `payout-poll-${orderId}`;
		const timeoutName = `payout-timeout-${orderId}`;

		try {
			this.schedulerRegistry.deleteInterval(intervalName);
		} catch {}

		try {
			this.schedulerRegistry.deleteTimeout(timeoutName);
		} catch {}
	}
}
