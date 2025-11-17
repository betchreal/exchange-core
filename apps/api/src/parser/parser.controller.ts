import {
	Body,
	Controller,
	HttpCode,
	Param,
	ParseFilePipe,
	ParseIntPipe,
	Post,
	Put,
	UploadedFile,
	UseInterceptors
} from '@nestjs/common';
import { ParserService } from './parser.service';
import { Serialize } from '../shared/decorators/serialize.decorator';
import { PluginInstallResponseDto } from '../shared/dtos/plugin-install-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateConfigDto } from '../shared/dtos/update-config.dto';

@Controller('parser')
export class ParserController {
	constructor(private readonly parserService: ParserService) {}

	@Post('install')
	@Serialize(PluginInstallResponseDto)
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
}
