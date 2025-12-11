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
import { ParserService } from './parser.service';
import { Serialize } from '../shared/decorators/serialize.decorator';
import { BasePluginInstallResponseDto } from '../shared/dtos/base-plugin-install-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateConfigDto } from '../shared/dtos/update-config.dto';
import { PluginActionResponseDto } from '../shared/dtos/plugin-action-response.dto';
import { UpdateIntervalDto } from './dtos/update-interval.dto';
import { UpdateIntervalResponseDto } from './dtos/update-interval-response.dto';
import { ParserDetailResponseDto } from './dtos/parser-detail-response.dto';
import { PluginListDto } from '../shared/dtos/plugin-list.dto';
import { StaffAccessGuard } from '../identity/guards/staff-access.guard';

@Controller('parser')
@UseGuards(StaffAccessGuard)
export class ParserController {
	constructor(private readonly parserService: ParserService) {}

	@Post('install')
	@Serialize(BasePluginInstallResponseDto)
	@UseInterceptors(FileInterceptor('file'))
	installPlugin(
		@UploadedFile('file', new ParseFilePipe()) file: Express.Multer.File
	) {
		return this.parserService.install(file.path, file.originalname);
	}

	@Put('config/:id')
	@HttpCode(204)
	replaceConfig(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateConfigDto
	) {
		return this.parserService.replace(id, dto.config);
	}

	@Post('launch/:id')
	@HttpCode(200)
	@Serialize(PluginActionResponseDto)
	launchPlugin(@Param('id', ParseIntPipe) id: number) {
		return this.parserService.launch(id);
	}

	@Put('interval/:id')
	@Serialize(UpdateIntervalResponseDto)
	updateInterval(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateIntervalDto
	) {
		return this.parserService.changeInterval(id, dto.intervalMs);
	}

	@Post('disable/:id')
	@HttpCode(200)
	@Serialize(PluginActionResponseDto)
	disablePlugin(@Param('id', ParseIntPipe) id: number) {
		return this.parserService.disable(id);
	}

	@Delete(':id')
	@HttpCode(204)
	removePlugin(@Param('id', ParseIntPipe) id: number) {
		return this.parserService.remove(id);
	}

	@Get('all')
	@Serialize(PluginListDto)
	getListOfPlugins() {
		return this.parserService.getList();
	}

	@Get(':id')
	@Serialize(ParserDetailResponseDto)
	getPlugin(@Param('id', ParseIntPipe) id: number) {
		return this.parserService.getOne(id);
	}
}
