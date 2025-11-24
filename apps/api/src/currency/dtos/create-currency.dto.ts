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
	ValidateNested,
	ValidationArguments,
	ValidatorConstraint,
	ValidatorConstraintInterface
} from 'class-validator';
import { CurrencyMerchantBinding, FieldType } from '@exchange-core/common';
import { Type } from 'class-transformer';
import Decimal from 'decimal.js';
import { FieldDto } from '../../shared/dtos/field.dto';
import { ManualMerchantDto } from '../../merchant/dtos/manual-merchant.dto';

@ValidatorConstraint({ async: false })
export class FieldTypeConstraint implements ValidatorConstraintInterface {
	validate(fields: FieldDto[], args: ValidationArguments) {
		const [type] = args.constraints as [FieldType];
		if (!fields || !Array.isArray(fields)) return false;
		return fields.every((field: FieldDto) => field.type === type);
	}
	defaultMessage(args: ValidationArguments) {
		return `${args.constraints[0]}Fields must contain only ${args.constraints[0]} type fields`;
	}
}

export class CreateCurrencyDto {
	@IsString()
	@MaxLength(32)
	@Matches(/\S/)
	name: string;

	@IsString()
	@Length(2, 5)
	@Matches(/^[A-Z]*$/)
	ticker: string;

	@IsInt()
	@Min(0)
	@Max(18)
	precision: number;

	@IsOptional()
	@IsString()
	@IsUrl({ require_protocol: true })
	iconUrl?: string;

	@IsOptional()
	@IsString()
	@Matches(/^(0|[1-9]\d*)(\.\d{1,18})?$/)
	reserve?: Decimal;

	@IsArray()
	@ValidateNested({ each: true })
	@Validate(FieldTypeConstraint, [FieldType.DEPOSIT])
	@Type(() => FieldDto)
	depositFields: FieldDto[];

	@IsArray()
	@ValidateNested({ each: true })
	@Validate(FieldTypeConstraint, [FieldType.WITHDRAW])
	@Type(() => FieldDto)
	withdrawFields: FieldDto[];

	@IsOptional()
	@IsBoolean()
	active: boolean;

	@IsEnum(CurrencyMerchantBinding)
	merchantBinding: CurrencyMerchantBinding;

	@IsString()
	@Length(1, 16)
	@Matches(/^[A-Z0-9]*$/)
	code: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	payoutId?: number;

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
	amlId?: number;
}
