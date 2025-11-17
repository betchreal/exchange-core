import { Expose } from 'class-transformer';
import { PluginStatus } from '@exchange-core/common';

export class PluginActionResponseDto {
	@Expose()
	id: number;

	@Expose()
	status: PluginStatus;
}
