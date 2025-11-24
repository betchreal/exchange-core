import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	ParseFilePipe,
	ParseIntPipe,
	Post,
	Put,
	UploadedFile,
	UseInterceptors
} from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { Serialize } from '../shared/decorators/serialize.decorator';
import { PluginInstallResponseDto } from '../shared/dtos/plugin-install-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateConfigDto } from '../shared/dtos/update-config.dto';
import { PluginActionResponseDto } from '../shared/dtos/plugin-action-response.dto';
import { BasePluginDetailResponseDto } from '../shared/dtos/base-plugin-detail-response.dto';
import { MerchantDetailResponseDto } from './dtos/merchant-detail-response.dto';

@Controller('merchant')
export class MerchantController {
	constructor(private readonly merchantService: MerchantService) {}

	@Post('install')
	@Serialize(PluginInstallResponseDto)
	@UseInterceptors(FileInterceptor('file'))
	installPlugin(
		@UploadedFile('file', new ParseFilePipe()) file: Express.Multer.File
	) {
		return this.merchantService.install(file.path, file.originalname);
	}

	@Put('config/:id')
	@HttpCode(204)
	replaceConfig(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateConfigDto
	) {
		return this.merchantService.replace(id, dto.config);
	}

	@Post('launch/:id')
	@HttpCode(200)
	@Serialize(PluginActionResponseDto)
	launchPlugin(@Param('id', ParseIntPipe) id: number) {
		return this.merchantService.launch(id);
	}

	@Post('disable/:id')
	@HttpCode(200)
	@Serialize(PluginActionResponseDto)
	disablePlugin(@Param('id', ParseIntPipe) id: number) {
		return this.merchantService.disable(id);
	}

	@Delete(':id')
	@HttpCode(204)
	removePlugin(@Param('id', ParseIntPipe) id: number) {
		return this.merchantService.remove(id);
	}

	@Get(':id')
	@Serialize(MerchantDetailResponseDto)
	getPlugin(@Param('id', ParseIntPipe) id: number) {
		return this.merchantService.getOne(id);
	}
}
