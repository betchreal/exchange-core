import { Expose } from 'class-transformer';

class PaymentDetailDto {
	@Expose()
	label: string;

	@Expose()
	value: string;
}

export class PaymentDetailsDto {
	@Expose()
	details: PaymentDetailDto;
}
