import { Expose, Type } from 'class-transformer';
import { OrderItemDto } from './order-item.dto';

export class OrdersListResponseDto {
	@Expose()
	@Type(() => OrderItemDto)
	data: OrderItemDto[];

	@Expose()
	total: number;

	@Expose()
	page: number;

	@Expose()
	limit: number;

	@Expose()
	totalPages: number;
}
