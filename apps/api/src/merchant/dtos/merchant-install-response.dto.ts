import { BasePluginInstallResponseDto } from '../../shared/dtos/base-plugin-install-response.dto';
import { Expose } from 'class-transformer';

export class MerchantInstallResponseDto extends BasePluginInstallResponseDto {
	@Expose()
	webhookUrl?: string;
}
