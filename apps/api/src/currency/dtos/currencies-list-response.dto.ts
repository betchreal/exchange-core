import { Expose, Type } from 'class-transformer';
import { CurrencyResponseDto } from './currency-response.dto';

export class CurrenciesListResponseDto {
	@Expose()
	@Type(() => CurrencyResponseDto)
	data: CurrencyResponseDto[];

	@Expose()
	total: number;

	@Expose()
	page: number;

	@Expose()
	limit: number;

	@Expose()
	totalPages: number;
}
