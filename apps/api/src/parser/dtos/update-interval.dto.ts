import { IsInt, Max, Min } from 'class-validator';

export class UpdateIntervalDto {
	@IsInt()
	@Min(5000)
	@Max(100000)
	intervalMs: number;
}
