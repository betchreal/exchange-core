import { Expose } from 'class-transformer';
import { PluginStatus } from '@exchange-core/common';

export class PluginListDto {
	@Expose()
	id: number;

	@Expose()
	name: string;

	@Expose()
	version: string;

	@Expose()
	status: PluginStatus;
}
