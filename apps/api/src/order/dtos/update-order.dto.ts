import { IsEnum, IsInt, IsOptional, IsString, Length } from 'class-validator';
import { OrderStatus } from '@exchange-core/common';

export class UpdateOrderDto {
	@IsOptional()
	@IsEnum(OrderStatus)
	status?: OrderStatus;

	@IsOptional()
	@IsInt()
	managerId?: number | null;

	@IsOptional()
	@IsString()
	@Length(1, 512)
	comment?: string;
}
