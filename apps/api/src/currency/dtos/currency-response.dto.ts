import { Expose, Transform, Type } from 'class-transformer';
import { CurrencyMerchantBinding } from '@exchange-core/common';
import { FieldDto } from '../../shared/dtos/field.dto';
import { ManualMerchantDto } from '../../merchant/dtos/manual-merchant.dto';

export class CurrencyResponseDto {
	@Expose()
	id: number;

	@Expose()
	name: string;

	@Expose()
	ticker: string;

	@Expose()
	precision: number;

	@Expose()
	iconUrl?: string | null;

	@Expose()
	reserve: string;

	@Expose()
	@Type(() => FieldDto)
	depositFields: FieldDto[];

	@Expose()
	@Type(() => FieldDto)
	withdrawFields: FieldDto[];

	@Expose()
	active: boolean;

	@Expose()
	merchantBinding: CurrencyMerchantBinding;

	@Expose()
	@Transform(({ obj }) => obj.code.code)
	code: string;

	@Expose()
	@Transform(({ obj }) => obj.payout?.id ?? null)
	payoutId: number | null;

	@Expose()
	@Transform(({ obj }) => obj.merchant?.id ?? null)
	merchantId: number | null;

	@Expose()
	@Type(() => ManualMerchantDto)
	manualMerchant: ManualMerchantDto | null;

	@Expose()
	@Transform(({ obj }) => obj.aml?.id ?? null)
	amlId: number | null;

	@Expose()
	createdAt: Date;

	@Expose()
	updatedAt: Date;
}
