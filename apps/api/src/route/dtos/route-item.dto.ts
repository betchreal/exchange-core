import { Expose, Transform } from 'class-transformer';

export class RouteItemDto {
	@Expose()
	id: number;

	@Expose()
	@Transform(({ obj }) => ({
		id: obj.fromCurrency.id,
		name: obj.fromCurrency.name,
		ticker: obj.fromCurrency.ticker
	}))
	fromCurrency: {
		id: number;
		name: string;
		ticker: string;
	};

	@Expose()
	@Transform(({ obj }) => ({
		id: obj.toCurrency.id,
		name: obj.toCurrency.name,
		ticker: obj.toCurrency.ticker
	}))
	toCurrency: {
		id: number;
		name: string;
		ticker: string;
	};

	@Expose()
	rate: string | null;

	@Expose()
	commissionPercentage: string;

	@Expose()
	active: boolean;

	@Expose()
	createdAt: Date;

	@Expose()
	updatedAt: Date;
}
