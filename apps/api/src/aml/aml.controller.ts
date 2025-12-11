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
	UseGuards,
	UseInterceptors
} from '@nestjs/common';
import { AmlService } from './aml.service';
import { Serialize } from '../shared/decorators/serialize.decorator';
import { BasePluginInstallResponseDto } from '../shared/dtos/base-plugin-install-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateConfigDto } from '../shared/dtos/update-config.dto';
import { PluginActionResponseDto } from '../shared/dtos/plugin-action-response.dto';
import { AmlDetailResponseDto } from './dtos/aml-detail-response.dto';
import { PluginListDto } from '../shared/dtos/plugin-list.dto';
import { StaffAccessGuard } from '../identity/guards/staff-access.guard';

@Controller('aml')
@UseGuards(StaffAccessGuard)
export class AmlController {
	constructor(private readonly amlService: AmlService) {}

	@Post('install')
	@Serialize(BasePluginInstallResponseDto)
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

	@Get('all')
	@Serialize(PluginListDto)
	getListOfPlugins() {
		return this.amlService.getList();
	}

	@Get(':id')
	@Serialize(AmlDetailResponseDto)
	getPlugin(@Param('id', ParseIntPipe) id: number) {
		return this.amlService.getOne(id);
	}
}
