import { BasePluginInstallResponseDto } from '../../shared/dtos/base-plugin-install-response.dto';
import { Expose } from 'class-transformer';

export class PayoutInstallResponseDto extends BasePluginInstallResponseDto {
	@Expose()
	webhookUrl?: string;
}
