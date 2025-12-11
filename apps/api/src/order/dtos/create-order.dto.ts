import {
	IsArray,
	IsInt,
	IsObject,
	IsOptional,
	IsString,
	Matches,
	Min,
	ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import Decimal from 'decimal.js';
import { FormValuesDto } from './form-values.dto';

export class CreateOrderDto {
	@IsOptional()
	@IsString()
	@Matches(/^(0|[1-9]\d*)(\.\d{1,18})?$/)
	amountFrom?: Decimal;

	@IsOptional()
	@IsString()
	@Matches(/^(0|[1-9]\d*)(\.\d{1,18})?$/)
	amountTo?: Decimal;

	@IsObject()
	@ValidateNested()
	@Type(() => FormValuesDto)
	formValues: FormValuesDto;

	@IsInt()
	@Min(1)
	routeId: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	principalId?: number;
}
