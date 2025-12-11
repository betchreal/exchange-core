import { IsArray, IsString, Matches, ValidateNested } from 'class-validator';
import type { FormValues } from '@exchange-core/common';
import { Expose, Type } from 'class-transformer';

class FormValueDto {
	@Expose()
	@IsString()
	label: string;

	@Expose()
	@IsString()
	value: string;

	@Expose()
	@IsString()
	@Matches(/^(currency|route|plugin)$/)
	source: 'currency' | 'route' | 'plugin';
}

export class FormValuesDto implements FormValues {
	@Expose()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => FormValueDto)
	deposit: FormValueDto[];

	@Expose()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => FormValueDto)
	withdraw: FormValueDto[];

	@Expose()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => FormValueDto)
	extra: FormValueDto[];
}
