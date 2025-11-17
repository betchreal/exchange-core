import { IsObject } from 'class-validator';

export class UpdateConfigDto {
	@IsObject()
	config: Record<string, any>;
}
