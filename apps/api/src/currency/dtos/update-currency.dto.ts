import {
	IsArray,
	IsBoolean,
	IsDefined,
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	IsUrl,
	Length,
	Matches,
	Max,
	MaxLength,
	Min,
	Validate,
	ValidateIf,
	ValidateNested
} from 'class-validator';
import { CurrencyMerchantBinding, FieldType } from '@exchange-core/common';
import { Type } from 'class-transformer';
import Decimal from 'decimal.js';
import { FieldDto } from '../../shared/dtos/field.dto';
import { FieldTypeConstraint } from './create-currency.dto';
import { ManualMerchantDto } from '../../merchant/dtos/manual-merchant.dto';

export class UpdateCurrencyDto {
	@IsOptional()
	@IsString()
	@MaxLength(32)
	@Matches(/\S/)
	name?: string;

	@IsOptional()
	@IsString()
	@Length(2, 5)
	@Matches(/^[A-Z]*$/)
	ticker?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Max(18)
	precision?: number;

	@IsOptional()
	@IsString()
	@IsUrl({ require_protocol: true })
	iconUrl?: string | null;

	@IsOptional()
	@IsString()
	@Matches(/^(0|[1-9]\d*)(\.\d{1,18})?$/)
	reserve?: Decimal;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Validate(FieldTypeConstraint, [FieldType.DEPOSIT])
	@Type(() => FieldDto)
	depositFields?: FieldDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Validate(FieldTypeConstraint, [FieldType.WITHDRAW])
	@Type(() => FieldDto)
	withdrawFields?: FieldDto[];

	@IsOptional()
	@IsBoolean()
	active?: boolean;

	@IsOptional()
	@IsEnum(CurrencyMerchantBinding)
	merchantBinding?: CurrencyMerchantBinding;

	@IsOptional()
	@IsString()
	@Length(1, 16)
	@Matches(/^[A-Z0-9]*$/)
	code?: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	payoutId?: number | null;

	@ValidateIf(
		(obj) => obj.merchantBinding === CurrencyMerchantBinding.EXPLICIT
	)
	@IsDefined()
	@IsInt()
	@Min(1)
	merchantId?: number;

	@ValidateIf((obj) => obj.merchantBinding === CurrencyMerchantBinding.MANUAL)
	@IsDefined()
	@ValidateNested()
	@Type(() => ManualMerchantDto)
	manualMerchant?: ManualMerchantDto;

	@IsOptional()
	@IsInt()
	@Min(1)
	amlId?: number | null;
}
