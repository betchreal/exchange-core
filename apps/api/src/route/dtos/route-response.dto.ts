import { Expose, Transform, Type } from 'class-transformer';
import {
	AmlBinding,
	Field,
	PayoutBinding,
	RouteMerchantBinding
} from '@exchange-core/common';
import Decimal from 'decimal.js';
import { FieldDto } from '../../shared/dtos/field.dto';
import { ManualMerchantDto } from '../../merchant/dtos/manual-merchant.dto';

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
	@Type(() => FieldDto)
	extraFields: FieldDto[];

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
	@Transform(({ obj }) => obj.parser.id)
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
