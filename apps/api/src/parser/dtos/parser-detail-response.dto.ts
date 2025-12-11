import { BasePluginDetailResponseDto } from '../../shared/dtos/base-plugin-detail-response.dto';
import { Expose, Transform } from 'class-transformer';

export class ParserDetailResponseDto extends BasePluginDetailResponseDto {
	@Expose()
	@Transform(({ obj }) => obj.manifest.supportedPairs)
	supportedPairs: Record<string, string[]>;

	@Expose()
	intervalMs: number;
}
