import {
	Check,
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';
import Decimal from 'decimal.js';
import { Currency } from '../../currency/entities/currency.entity';
import { Parser } from '../../parser/entities/parser.entity';
import { Payout } from '../../payout/entities/payout.entity';
import { Merchant } from '../../merchant/entities/merchant.entity';
import { Aml } from '../../aml/entities/aml.entity';
import {
	AmlBinding,
	type Field,
	RouteMerchantBinding,
	NumericTransformer,
	PayoutBinding
} from '@exchange-core/common';
import { ManualMerchant } from '../../merchant/entities/manual-merchant.entity';

@Entity('routes')
@Check(`"minFrom" >= 0`)
@Check(`"maxFrom" > "minFrom"`)
@Check(`"minTo" >= 0`)
@Check(`"maxTo" > "minTo"`)
@Check(`"commissionAmount" >= 0`)
@Check(`"lossAmount" >= 0`)
@Check(`"commissionPercentage" BETWEEN 0 AND 100`)
@Check(`"lossPercentage" BETWEEN 0 AND 100`)
@Check(`jsonb_typeof("extraFields") = 'array'`)
@Check(`"fromCurrency" <> "toCurrency"`)
@Check(`"orderLifetimeMs" > 0 AND "orderLifetimeMs" <= 36000000`)
@Check(`(active = true AND "parserId" IS NOT NULL) OR (active = false)`)
@Check(
	`(active = true AND (("payoutBinding" = 'default' AND "payoutId" IS NULL) OR ("payoutBinding" = 'explicit' AND "payoutId" IS NOT NULL) OR ("payoutBinding" = 'none' AND "payoutId" IS NULL))) OR (active = false)`
)
@Check(
	`(active = true AND (("merchantBinding" = 'default' AND "merchantId" IS NULL AND "manualMerchantId" IS NULL) OR ("merchantBinding" = 'explicit' AND "merchantId" IS NOT NULL AND "manualMerchantId" IS NULL) OR ("merchantBinding" = 'manual' AND "merchantId" IS NULL AND "manualMerchantId" IS NOT NULL))) OR (active = false)`
)
@Check(
	`(active = true AND (("depositAmlBinding" = 'default' AND "depositAmlId" IS NULL) OR ("depositAmlBinding" = 'explicit' AND "depositAmlId" IS NOT NULL) OR ("depositAmlBinding" = 'none' AND "depositAmlId" IS NULL))) OR (active = false)`
)
@Check(
	`(active = true AND (("withdrawAmlBinding" = 'default' AND "withdrawAmlId" IS NULL) OR ("withdrawAmlBinding" = 'explicit' AND "withdrawAmlId" IS NOT NULL) OR ("withdrawAmlBinding" = 'none' AND "withdrawAmlId" IS NULL))) OR (active = false)`
)
export class Route {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({
		type: 'numeric',
		precision: 38,
		scale: 18,
		transformer: new NumericTransformer()
	})
	minFrom: Decimal;

	@Column({
		type: 'numeric',
		precision: 38,
		scale: 18,
		transformer: new NumericTransformer()
	})
	maxFrom: Decimal;

	@Column({
		type: 'numeric',
		precision: 38,
		scale: 18,
		transformer: new NumericTransformer()
	})
	minTo: Decimal;

	@Column({
		type: 'numeric',
		precision: 38,
		scale: 18,
		transformer: new NumericTransformer()
	})
	maxTo: Decimal;

	@Column({
		type: 'jsonb',
		default: () => "'[]'::jsonb"
	})
	extraFields: Field[];

	@Column({
		type: 'boolean',
		default: true
	})
	active: boolean;

	@Column({
		type: 'numeric',
		precision: 38,
		scale: 18,
		transformer: new NumericTransformer(),
		default: 0
	})
	commissionAmount: Decimal;

	@Column({
		type: 'numeric',
		precision: 7,
		scale: 4,
		transformer: new NumericTransformer(),
		default: 0
	})
	commissionPercentage: Decimal;

	@Column({
		type: 'numeric',
		precision: 38,
		scale: 18,
		transformer: new NumericTransformer(),
		default: 0
	})
	lossAmount: Decimal;

	@Column({
		type: 'numeric',
		precision: 7,
		scale: 4,
		transformer: new NumericTransformer(),
		default: 0
	})
	lossPercentage: Decimal;

	@Column({
		type: 'enum',
		enum: PayoutBinding,
		enumName: 'payout_binding_enum'
	})
	payoutBinding: PayoutBinding;

	@Column({
		type: 'enum',
		enum: RouteMerchantBinding,
		enumName: 'route_merchant_binding_enum'
	})
	merchantBinding: RouteMerchantBinding;

	@Column({
		type: 'enum',
		enum: AmlBinding,
		enumName: 'deposit_aml_binding_enum'
	})
	depositAmlBinding: AmlBinding;

	@Column({
		type: 'enum',
		enum: AmlBinding,
		enumName: 'withdraw_aml_binding_enum'
	})
	withdrawAmlBinding: AmlBinding;

	@Column({
		type: 'integer'
	})
	orderLifetimeMs: number;

	@Column({
		type: 'varchar',
		length: 16
	})
	fromCurrencyParser: string;

	@Column({
		type: 'varchar',
		length: 16
	})
	toCurrencyParser: string;

	@CreateDateColumn({
		type: 'timestamptz'
	})
	createdAt: Date;

	@UpdateDateColumn({
		type: 'timestamptz'
	})
	updatedAt: Date;

	@ManyToOne(() => Currency, (currency) => currency.routesFrom, {
		nullable: false,
		onDelete: 'RESTRICT'
	})
	@JoinColumn({ name: 'fromCurrency' })
	fromCurrency: Currency;

	@ManyToOne(() => Currency, (currency) => currency.routesTo, {
		nullable: false,
		onDelete: 'RESTRICT'
	})
	@JoinColumn({ name: 'toCurrency' })
	toCurrency: Currency;

	@ManyToOne(() => Parser, (parser) => parser.routes, {
		onDelete: 'RESTRICT'
	})
	@JoinColumn({ name: 'parserId' })
	parser: Parser | null;

	@ManyToOne(() => Payout, (payout) => payout.routes, {
		onDelete: 'SET NULL'
	})
	@JoinColumn({ name: 'payoutId' })
	payout?: Payout | null;

	@ManyToOne(() => Merchant, (merchant) => merchant.routes, {
		onDelete: 'RESTRICT'
	})
	@JoinColumn({ name: 'merchantId' })
	merchant?: Merchant | null;

	@OneToOne(() => ManualMerchant, {
		onDelete: 'RESTRICT'
	})
	@JoinColumn({ name: 'manualMerchantId' })
	manualMerchant?: ManualMerchant | null;

	@ManyToOne(() => Aml, (aml) => aml.depositRoutes, {
		onDelete: 'SET NULL'
	})
	@JoinColumn({ name: 'depositAmlId' })
	depositAml?: Aml | null;

	@ManyToOne(() => Aml, (aml) => aml.withdrawRoutes, {
		onDelete: 'SET NULL'
	})
	@JoinColumn({ name: 'withdrawAmlId' })
	withdrawAml?: Aml | null;
}
