import { Expose, Transform } from 'class-transformer';
import { OrderStatus, PrincipalType } from '@exchange-core/common';
import { Order } from '../entities/order.entity';

export class OrderItemDto {
	@Expose()
	id: number;

	@Expose()
	amountFrom: string;

	@Expose()
	amountTo: string;

	@Expose()
	status: OrderStatus;

	@Expose()
	@Transform(({ obj }) => obj.routeSnapshot.fromCurrency)
	fromCurrency: {
		name: string;
		ticker: string;
	};

	@Expose()
	@Transform(({ obj }) => obj.routeSnapshot.toCurrency)
	toCurrency: {
		name: string;
		ticker: string;
	};

	@Expose()
	@Transform(({ obj }) => (obj as Order).rateFromTo.toString())
	rateFromTo: string | null;

	@Expose()
	@Transform(({ obj }) =>
		obj.staff ? { id: obj.staff.id, email: obj.staff.email } : null
	)
	staff: {
		id: number;
		email: string;
	} | null;

	@Expose()
	createdAt: Date;
}
