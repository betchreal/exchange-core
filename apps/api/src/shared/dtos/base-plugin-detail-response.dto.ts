import { Expose, Transform } from 'class-transformer';
import { PluginStatus, PluginType } from '@exchange-core/common';

export abstract class BasePluginDetailResponseDto {
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
	@Transform(({ obj }) => obj.manifest.egress)
	egress: string[];

	@Expose()
	@Transform(({ obj }) => obj.manifest.configSchema)
	configSchema: Record<string, any>;

	@Expose()
	createdAt: Date;

	@Expose()
	updatedAt: Date;
}
