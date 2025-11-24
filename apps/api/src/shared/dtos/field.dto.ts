import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { FieldType, FieldValidator } from '@exchange-core/common';
import { Expose } from 'class-transformer';

export class FieldDto {
	@Expose()
	@IsString()
	@IsNotEmpty()
	label: string;

	@Expose()
	@IsString()
	@IsNotEmpty()
	hint: string;

	@Expose()
	@IsOptional()
	@IsEnum(FieldType)
	type: FieldType;

	@Expose()
	@IsEnum(FieldValidator)
	validator: FieldValidator;
}
