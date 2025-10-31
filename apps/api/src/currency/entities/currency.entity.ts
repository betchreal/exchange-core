import {
	Check,
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';
import Decimal from 'decimal.js';
import {
	type Field,
	CurrencyMerchantBinding,
	NumericTransformer
} from '@exchange-core/common';
import { Payout } from '../../payout/entities/payout.entity';
import { Merchant } from '../../merchant/entities/merchant.entity';
import { ManualMerchant } from '../../merchant/entities/manual-merchant.entity';
import { Aml } from '../../aml/entities/aml.entity';
import { CurrencyCode } from './currency-code.entity';
import { Route } from '../../route/entities/route.entity';

@Entity('currencies')
@Check(`btrim(name) <> ''`)
@Check(`ticker ~ '^[A-Z]{2,}$'`)
@Check(`precision BETWEEN 0 AND 18`)
@Check(`"iconUrl" IS NULL OR btrim("iconUrl") <> ''`)
@Check(`reserve >= 0`)
@Check(`jsonb_typeof("depositFields") = 'array'`)
@Check(`jsonb_typeof("withdrawFields") = 'array'`)
@Check(
	`("merchantBinding" = 'explicit' AND "merchantId" IS NOT NULL AND "manualMerchantId" IS NULL) OR ("merchantBinding" = 'manual' AND "merchantId" IS NULL AND "manualMerchantId" IS NOT NULL)`
)
export class Currency {
	@PrimaryGeneratedColumn()
	currencyId: number;

	@Column({
		type: 'varchar',
		length: 32,
		unique: true
	})
	name: string;

	@Column({
		type: 'varchar',
		length: 5
	})
	ticker: string;

	@Column({
		type: 'smallint'
	})
	precision: number;

	@Column({
		type: 'text',
		nullable: true
	})
	iconUrl?: string;

	@Column({
		type: 'numeric',
		precision: 38,
		scale: 18,
		default: 0,
		transformer: new NumericTransformer()
	})
	reserve: Decimal;

	@Column({
		type: 'jsonb',
		default: () => "'[]'::jsonb"
	})
	depositFields: Field[];

	@Column({
		type: 'jsonb',
		default: () => "'[]'::jsonb"
	})
	withdrawFields: Field[];

	@Column({
		type: 'boolean',
		default: true
	})
	active: boolean;

	@Column({
		type: 'enum',
		enum: CurrencyMerchantBinding,
		enumName: 'currency_merchant_binding_enum'
	})
	merchantBinding: CurrencyMerchantBinding;

	@CreateDateColumn({
		type: 'timestamptz'
	})
	createdAt: Date;

	@UpdateDateColumn({
		type: 'timestamptz'
	})
	updatedAt: Date;

	@ManyToOne(() => CurrencyCode, {
		nullable: false,
		onDelete: 'RESTRICT'
	})
	@JoinColumn({ name: 'code' })
	code: CurrencyCode;

	@ManyToOne(() => Payout, (payout) => payout.currencies, {
		onDelete: 'SET NULL'
	})
	@JoinColumn({ name: 'payoutId' })
	payout?: Payout | null;

	@ManyToOne(() => Merchant, (merchant) => merchant.currencies, {
		onDelete: 'RESTRICT'
	})
	@JoinColumn({ name: 'merchantId' })
	merchant?: Merchant | null;

	@OneToOne(() => ManualMerchant, {
		onDelete: 'RESTRICT'
	})
	@JoinColumn({ name: 'manualMerchantId' })
	manualMerchant?: ManualMerchant | null;

	@ManyToOne(() => Aml, (aml) => aml.currencies, {
		onDelete: 'SET NULL'
	})
	@JoinColumn({ name: 'amlId' })
	aml?: Aml | null;

	@OneToMany(() => Route, (route) => route.fromCurrency)
	routesFrom: Route[];

	@OneToMany(() => Route, (route) => route.toCurrency)
	routesTo: Route[];
}
