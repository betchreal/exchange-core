import {
	IsArray,
	IsBoolean,
	IsDefined,
	IsEnum,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	Length,
	Matches,
	Max,
	Min,
	Validate,
	ValidateIf,
	ValidateNested,
	ValidationArguments,
	ValidatorConstraint,
	ValidatorConstraintInterface
} from 'class-validator';
import { Type } from 'class-transformer';
import { FieldDto } from '../../shared/dtos/field.dto';
import Decimal from 'decimal.js';
import {
	AmlBinding,
	PayoutBinding,
	RouteMerchantBinding
} from '@exchange-core/common';
import { ManualMerchantDto } from '../../merchant/dtos/manual-merchant.dto';

@ValidatorConstraint({ name: 'differentCurrencies', async: false })
class DifferentCurrenciesConstraint implements ValidatorConstraintInterface {
	validate(value: any, args: ValidationArguments) {
		const obj = args.object as CreateRouteDto;
		return obj.fromCurrencyId !== obj.toCurrencyId;
	}

	defaultMessage(): string {
		return "'from' and 'to' currencies must be different";
	}
}

export class CreateRouteDto {
	@IsString()
	@Matches(/^(0|[1-9]\d*)(\.\d{1,18})?$/)
	minFrom: Decimal;

	@IsString()
	@Matches(/^(0|[1-9]\d*)(\.\d{1,18})?$/)
	maxFrom: Decimal;

	@IsString()
	@Matches(/^(0|[1-9]\d*)(\.\d{1,18})?$/)
	minTo: Decimal;

	@IsString()
	@Matches(/^(0|[1-9]\d*)(\.\d{1,18})?$/)
	maxTo: Decimal;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => FieldDto)
	extraFields: FieldDto[];

	@IsOptional()
	@IsBoolean()
	active?: boolean;

	@IsOptional()
	@IsString()
	@Matches(/^(0|[1-9]\d*)(\.\d{1,18})?$/)
	commissionAmount?: Decimal;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(100)
	commissionPercentage?: Decimal;

	@IsOptional()
	@IsString()
	@Matches(/^(0|[1-9]\d*)(\.\d{1,18})?$/)
	lossAmount?: Decimal;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(100)
	lossPercentage?: Decimal;

	@IsEnum(PayoutBinding)
	payoutBinding: PayoutBinding;

	@IsEnum(RouteMerchantBinding)
	merchantBinding: RouteMerchantBinding;

	@IsEnum(AmlBinding)
	depositAmlBinding: AmlBinding;

	@IsEnum(AmlBinding)
	withdrawAmlBinding: AmlBinding;

	@IsString()
	@Length(1, 16)
	@Matches(/^[A-Z0-9_-]*$/)
	fromCurrencyParser: string;

	@IsString()
	@Length(1, 16)
	@Matches(/^[A-Z0-9_-]*$/)
	toCurrencyParser: string;

	@IsInt()
	@Min(1)
	fromCurrencyId: number;

	@IsInt()
	@Min(1)
	@Validate(DifferentCurrenciesConstraint)
	toCurrencyId: number;

	@IsInt()
	@Min(1)
	parserId: number;

	@ValidateIf((o) => o.payoutBinding === PayoutBinding.EXPLICIT)
	@IsDefined()
	@IsInt()
	@Min(1)
	payoutId?: number;

	@ValidateIf((o) => o.merchantBinding === RouteMerchantBinding.EXPLICIT)
	@IsDefined()
	@IsInt()
	@Min(1)
	merchantId?: number;

	@ValidateIf((o) => o.merchantBinding === RouteMerchantBinding.MANUAL)
	@IsDefined()
	@ValidateNested()
	@Type(() => ManualMerchantDto)
	manualMerchant?: ManualMerchantDto;

	@ValidateIf((o) => o.depositAmlBinding === AmlBinding.EXPLICIT)
	@IsDefined()
	@IsInt()
	@Min(1)
	depositAmlId?: number;

	@ValidateIf((o) => o.withdrawAmlBinding === AmlBinding.EXPLICIT)
	@IsDefined()
	@IsInt()
	@Min(1)
	withdrawAmlId?: number;
}
