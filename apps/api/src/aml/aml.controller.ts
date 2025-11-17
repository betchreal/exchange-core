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
import { AmlService } from './aml.service';
import { Serialize } from '../shared/decorators/serialize.decorator';
import { PluginInstallResponseDto } from '../shared/dtos/plugin-install-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateConfigDto } from '../shared/dtos/update-config.dto';
import { PluginActionResponseDto } from '../shared/dtos/plugin-action-response.dto';

@Controller('aml')
export class AmlController {
	constructor(private readonly amlService: AmlService) {}

	@Post('install')
	@Serialize(PluginInstallResponseDto)
	@UseInterceptors(FileInterceptor('file'))
	installPlugin(
		@UploadedFile('file', new ParseFilePipe()) file: Express.Multer.File
	) {
		return this.amlService.install(file.path, file.originalname);
	}

	@Put('config/:id')
	@HttpCode(204)
	replaceConfig(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateConfigDto
	) {
		return this.amlService.replace(id, dto.config);
	}

	@Post('launch/:id')
	@HttpCode(200)
	@Serialize(PluginActionResponseDto)
	launchPlugin(@Param('id', ParseIntPipe) id: number) {
		return this.amlService.launch(id);
	}

	@Post('disable/:id')
	@HttpCode(200)
	@Serialize(PluginActionResponseDto)
	disablePlugin(@Param('id', ParseIntPipe) id: number) {
		return this.amlService.disable(id);
	}

	@Delete(':id')
	@HttpCode(204)
	removePlugin(@Param('id', ParseIntPipe) id: number) {
		return this.amlService.remove(id);
	}
}
