import { Expose } from 'class-transformer';
import { PluginStatus, PluginType } from '@exchange-core/common';

export class PluginListResponseDto {
	@Expose()
	id: number;

	@Expose()
	name: string;

	@Expose()
	version: string;

	@Expose()
	type: PluginType;

	@Expose()
	status: PluginStatus;

	@Expose()
	createdAt: Date;

	@Expose()
	updatedAt: Date;
}
