import {
	Check,
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';
import Decimal from 'decimal.js';
import {
	type FormValues,
	NumericTransformer,
	OrderStatus,
	type RouteSnapshot
} from '@exchange-core/common';
import { Route } from '../../route/entities/route.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { Principal } from '../../identity/entities/principal.entity';

@Entity('orders')
@Check(`"amountFrom" > 0`)
@Check(`"amountTo" > 0`)
@Check(`btrim("url") <> ''`)
@Check(`jsonb_typeof("formValues") = 'object'`)
@Check(
	`"formValues" ? 'deposit' AND jsonb_typeof("formValues"->'deposit') = 'array'`
)
@Check(
	`"formValues" ? 'withdraw' AND jsonb_typeof("formValues"->'withdraw') = 'array'`
)
@Check(
	`"formValues" ? 'extra' AND jsonb_typeof("formValues"->'extra') = 'array'`
)
@Check(`jsonb_typeof("routeSnapshot") = 'object'`)
@Check(`"routeSnapshot" ? 'fromCurrency' AND "routeSnapshot" ? 'toCurrency'`)
@Check(`("routeSnapshot"->>'fromCurrency') ~ '^[A-Z0-9]{1,}$'`)
@Check(`("routeSnapshot"->>'toCurrency')   ~ '^[A-Z0-9]{1,}$'`)
@Check(`("routeSnapshot"->>'fromCurrency') <> ("routeSnapshot"->>'toCurrency')`)
@Check(
	`("status" IN ('not_paid', 'processing') AND "rateFromTo" IS NULL) OR ("status" NOT IN ('not_paid', 'processing') AND "rateFromTo" IS NOT NULL AND "rateFromTo" > 0)`
)
export class Order {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({
		type: 'numeric',
		precision: 38,
		scale: 18,
		transformer: new NumericTransformer()
	})
	amountFrom: Decimal;

	@Column({
		type: 'numeric',
		precision: 38,
		scale: 18,
		transformer: new NumericTransformer()
	})
	amountTo: Decimal;

	@Column({
		type: 'numeric',
		precision: 38,
		scale: 18,
		transformer: new NumericTransformer()
	})
	profit: Decimal;

	@Column({
		type: 'text'
	})
	url: string;

	@Column({
		type: 'enum',
		enum: OrderStatus,
		enumName: 'order_status_enum'
	})
	status: OrderStatus;

	@Column({
		type: 'numeric',
		precision: 38,
		scale: 18,
		transformer: new NumericTransformer(),
		nullable: true
	})
	rateFromTo: Decimal;

	@Column({
		type: 'jsonb'
	})
	formValues: FormValues;

	@Column({
		type: 'jsonb'
	})
	routeSnapshot: RouteSnapshot;

	@CreateDateColumn({
		type: 'timestamptz'
	})
	createdAt: Date;

	@UpdateDateColumn({
		type: 'timestamptz'
	})
	updatedAt: Date;

	@ManyToOne(() => Route, {
		onDelete: 'SET NULL'
	})
	@JoinColumn({ name: 'routeId' })
	route?: Route | null;

	@ManyToOne(() => Staff, {
		onDelete: 'SET NULL'
	})
	@JoinColumn({ name: 'employeeId' })
	staff?: Staff | null;

	@ManyToOne(() => Principal, {
		onDelete: 'SET NULL'
	})
	@JoinColumn({ name: 'principalId' })
	principal?: Principal | null;
}
