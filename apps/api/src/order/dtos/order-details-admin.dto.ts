import { Expose, Transform, Type } from 'class-transformer';
import {
	OrderStatus,
	type RouteSnapshot,
	PrincipalType
} from '@exchange-core/common';
import { FormValuesDto } from './form-values.dto';
import { PaymentDetailsDto } from './payment-details.dto';

export class OrderDetailsAdminDto {
	@Expose()
	id: number;

	@Expose()
	amountFrom: string;

	@Expose()
	amountTo: string;

	@Expose()
	profit: string;

	@Expose()
	status: OrderStatus;

	@Expose()
	rateFromTo: string;

	@Expose()
	url: string | null;

	@Expose()
	@Type(() => FormValuesDto)
	formValues: FormValuesDto;

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
	@Transform(({ obj }) =>
		obj.staff ? { id: obj.staff.id, email: obj.staff.email } : null
	)
	staff: {
		id: number;
		email: string;
	} | null;

	@Expose()
	@Transform(({ obj }) =>
		obj.client
			? { type: obj.client.type, ip: obj.client.ip, ua: obj.client.ua }
			: null
	)
	client: {
		type: PrincipalType;
		ip: string;
		ua: string;
	} | null;

	@Expose()
	createdAt: Date;

	@Expose()
	updatedAt: Date;
}
