import { Expose, Transform } from 'class-transformer';
import { FormValuesDto } from './form-values.dto';
import { OrderStatus } from '@exchange-core/common';
import { PaymentDetailsDto } from './payment-details.dto';

export class OrderDetailsClientDto {
	@Expose()
	id: number;

	@Expose()
	amountFrom: string;

	@Expose()
	amountTo: string;

	@Expose()
	status: OrderStatus;

	@Expose()
	rateFromTo: string;

	@Expose()
	@Transform(({ obj }) => obj.routeSnapshot.fromCurrency.ticker)
	fromCurrency: string;

	@Expose()
	@Transform(({ obj }) => obj.routeSnapshot.toCurrency.ticker)
	toCurrency: string;

	@Expose()
	expiresAt: Date | null;

	@Expose()
	@Transform(({ obj }) => obj.route.orderLifetimeMs)
	orderLifetimeMs: number;

	@Expose()
	formValues: FormValuesDto;

	@Expose()
	paymentDetails: PaymentDetailsDto;
}
