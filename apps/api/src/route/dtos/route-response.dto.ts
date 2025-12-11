import { Expose, Transform, Type } from 'class-transformer';
import {
	AmlBinding,
	PayoutBinding,
	RouteMerchantBinding
} from '@exchange-core/common';
import Decimal from 'decimal.js';
import { FieldDto } from '../../shared/dtos/field.dto';
import { ManualMerchantDto } from '../../merchant/dtos/manual-merchant.dto';

class FieldWithSourceDto extends FieldDto {
	@Expose()
	source: 'currency' | 'route' | 'plugin';
}

class FormFieldsDto {
	@Expose()
	@Type(() => FieldWithSourceDto)
	deposit: FieldWithSourceDto[];

	@Expose()
	@Type(() => FieldWithSourceDto)
	withdraw: FieldWithSourceDto[];

	@Expose()
	@Type(() => FieldWithSourceDto)
	extra: FieldWithSourceDto[];
}

export class RouteResponseDto {
	@Expose()
	id: number;

	@Expose()
	minFrom: string;

	@Expose()
	maxFrom: string;

	@Expose()
	minTo: string;

	@Expose()
	maxTo: string;

	@Expose()
	@Type(() => FormFieldsDto)
	formFields: FormFieldsDto;

	@Expose()
	rate: string | null;

	@Expose()
	active: boolean;

	@Expose()
	commissionAmount: string;

	@Expose()
	@Transform(({ value }) => new Decimal(value).toFixed(4))
	commissionPercentage: string;

	@Expose()
	lossAmount: string;

	@Expose()
	@Transform(({ value }) => new Decimal(value).toFixed(4))
	lossPercentage: string;

	@Expose()
	payoutBinding: PayoutBinding;

	@Expose()
	merchantBinding: RouteMerchantBinding;

	@Expose()
	depositAmlBinding: AmlBinding;

	@Expose()
	withdrawAmlBinding: AmlBinding;

	@Expose()
	@Transform(({ obj }) => obj.orderLifetimeMs / 60000)
	orderLifetimeMin: number;

	@Expose()
	fromCurrencyParser: string;

	@Expose()
	toCurrencyParser: string;

	@Expose()
	@Transform(({ obj }) => obj.fromCurrency.id)
	fromCurrencyId: number;

	@Expose()
	@Transform(({ obj }) => obj.toCurrency.id)
	toCurrencyId: number;

	@Expose()
	@Transform(({ obj }) => obj.parser?.id ?? null)
	parserId: number;

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
	@Transform(({ obj }) => obj.depositAml?.id ?? null)
	depositAmlId: number | null;

	@Expose()
	@Transform(({ obj }) => obj.withdrawAml?.id ?? null)
	withdrawAmlId: number | null;

	@Expose()
	createdAt: Date;

	@Expose()
	updatedAt: Date;
}
