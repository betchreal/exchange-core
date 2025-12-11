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

@ValidatorConstraint({ name: 'parserFieldsConsistency', async: false })
class ParserFieldsConsistencyConstraint
	implements ValidatorConstraintInterface
{
	validate(value: any, args: ValidationArguments) {
		const dto = args.object as UpdateRouteDto;
		const parserIdProvided = !!dto.parserId;
		const fromParserProvided = dto.fromCurrencyParser !== undefined;
		const toParserProvided = dto.toCurrencyParser !== undefined;

		if (parserIdProvided || fromParserProvided || toParserProvided) {
			return parserIdProvided && fromParserProvided && toParserProvided;
		}

		return true;
	}

	defaultMessage(): string {
		return 'When updating parser data, all three fields must be provided: parserId, fromCurrencyParser, toCurrencyParser';
	}
}

export class UpdateRouteDto {
	@IsOptional()
	@IsString()
	@Matches(/^(0|[1-9]\d*)(\.\d{1,18})?$/)
	minFrom?: Decimal;

	@IsOptional()
	@IsString()
	@Matches(/^(0|[1-9]\d*)(\.\d{1,18})?$/)
	maxFrom?: Decimal;

	@IsOptional()
	@IsString()
	@Matches(/^(0|[1-9]\d*)(\.\d{1,18})?$/)
	minTo?: Decimal;

	@IsOptional()
	@IsString()
	@Matches(/^(0|[1-9]\d*)(\.\d{1,18})?$/)
	maxTo?: Decimal;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => FieldDto)
	extraFields?: FieldDto[];

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

	@IsOptional()
	@IsEnum(PayoutBinding)
	payoutBinding?: PayoutBinding;

	@IsOptional()
	@IsEnum(RouteMerchantBinding)
	merchantBinding?: RouteMerchantBinding;

	@IsOptional()
	@IsEnum(AmlBinding)
	depositAmlBinding?: AmlBinding;

	@IsOptional()
	@IsEnum(AmlBinding)
	withdrawAmlBinding?: AmlBinding;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Validate(ParserFieldsConsistencyConstraint)
	parserId?: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(600)
	orderLifetimeMin: number;

	@IsOptional()
	@IsString()
	@Length(1, 16)
	@Matches(/^[A-Z0-9_-]*$/)
	@Validate(ParserFieldsConsistencyConstraint)
	fromCurrencyParser?: string;

	@IsOptional()
	@IsString()
	@Length(1, 16)
	@Matches(/^[A-Z0-9_-]*$/)
	@Validate(ParserFieldsConsistencyConstraint)
	toCurrencyParser?: string;

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
