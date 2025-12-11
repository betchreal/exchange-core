import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderStatus } from '@exchange-core/common';

export class GetOrdersQueryDto {
	@IsOptional()
	@Transform(({ value }) =>
		Array.isArray(value) ? value : value ? [value] : undefined
	)
	@IsEnum(OrderStatus, { each: true })
	status?: OrderStatus[];

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Type(() => Number)
	page: number = 1;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Type(() => Number)
	limit: number = 20;
}
