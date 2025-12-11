import { BasePluginDetailResponseDto } from '../../shared/dtos/base-plugin-detail-response.dto';
import { Expose, Transform } from 'class-transformer';

export class PayoutDetailResponseDto extends BasePluginDetailResponseDto {
	@Expose()
	@Transform(({ obj }) => obj.manifest.allowCurrencyCodes)
	allowCurrencyCodes: string[];

	@Expose()
	webhookUrl?: string;
}
