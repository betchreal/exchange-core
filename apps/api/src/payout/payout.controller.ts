import {
	Body,
	Controller,
	Delete,
	HttpCode,
	Param,
	ParseFilePipe,
	ParseIntPipe,
	Post,
	Put,
	UploadedFile,
	UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PayoutService } from './payout.service';
import { Serialize } from '../shared/decorators/serialize.decorator';
import { PluginInstallResponseDto } from '../shared/dtos/plugin-install-response.dto';
import { UpdateConfigDto } from '../shared/dtos/update-config.dto';
import { PluginActionResponseDto } from '../shared/dtos/plugin-action-response.dto';

@Controller('payout')
export class PayoutController {
	constructor(private readonly payoutService: PayoutService) {}

	@Post('install')
	@Serialize(PluginInstallResponseDto)
	@UseInterceptors(FileInterceptor('file'))
	installPlugin(
		@UploadedFile('file', new ParseFilePipe()) file: Express.Multer.File
	) {
		return this.payoutService.install(file.path, file.originalname);
	}

	@Put('config/:id')
	@HttpCode(204)
	replaceConfig(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateConfigDto
	) {
		return this.payoutService.replace(id, dto.config);
	}

	@Post('launch/:id')
	@HttpCode(200)
	@Serialize(PluginActionResponseDto)
	launchPlugin(@Param('id', ParseIntPipe) id: number) {
		return this.payoutService.launch(id);
	}

	@Post('disable/:id')
	@HttpCode(200)
	@Serialize(PluginActionResponseDto)
	disablePlugin(@Param('id', ParseIntPipe) id: number) {
		return this.payoutService.disable(id);
	}

	@Delete(':id')
	@HttpCode(204)
	removePlugin(@Param('id', ParseIntPipe) id: number) {
		return this.payoutService.remove(id);
	}
}
