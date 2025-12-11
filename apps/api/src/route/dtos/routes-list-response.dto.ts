import { Expose, Type } from 'class-transformer';
import { RouteItemDto } from './route-item.dto';

export class RoutesListResponseDto {
	@Expose()
	@Type(() => RouteItemDto)
	data: RouteItemDto[];

	@Expose()
	total: number;

	@Expose()
	page: number;

	@Expose()
	limit: number;

	@Expose()
	totalPages: number;
}
