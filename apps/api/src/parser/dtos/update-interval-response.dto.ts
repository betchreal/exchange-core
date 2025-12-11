import { Expose } from 'class-transformer';

export class UpdateIntervalResponseDto {
	@Expose()
	id: number;

	@Expose()
	intervalMs: number;
}
