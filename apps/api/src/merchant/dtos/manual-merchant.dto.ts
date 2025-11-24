import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Expose } from 'class-transformer';

export class ManualMerchantDto {
	@Expose()
	id: number;

	@Expose()
	@IsString()
	@IsNotEmpty()
	@MaxLength(128)
	paymentSystem: string;

	@Expose()
	@IsString()
	@IsNotEmpty()
	@MaxLength(128)
	paymentAccount: string;

	@Expose()
	@IsOptional()
	@IsString()
	@MaxLength(512)
	comment?: string;
}
