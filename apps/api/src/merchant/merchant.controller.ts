import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	HttpCode,
	Param,
	ParseFilePipe,
	ParseIntPipe,
	Post,
	Put,
	Query,
	UploadedFile,
	UseGuards,
	UseInterceptors
} from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { Serialize } from '../shared/decorators/serialize.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateConfigDto } from '../shared/dtos/update-config.dto';
import { PluginActionResponseDto } from '../shared/dtos/plugin-action-response.dto';
import { MerchantDetailResponseDto } from './dtos/merchant-detail-response.dto';
import { MerchantInstallResponseDto } from './dtos/merchant-install-response.dto';
import { PluginListDto } from '../shared/dtos/plugin-list.dto';
import { StaffAccessGuard } from '../identity/guards/staff-access.guard';

@Controller('merchant')
export class MerchantController {
	constructor(private readonly merchantService: MerchantService) {}

	@Post('install')
	@Serialize(MerchantInstallResponseDto)
	@UseInterceptors(FileInterceptor('file'))
	@UseGuards(StaffAccessGuard)
	installPlugin(
		@UploadedFile('file', new ParseFilePipe()) file: Express.Multer.File
	) {
		return this.merchantService.install(file.path, file.originalname);
	}

	@Put('config/:id')
	@HttpCode(204)
	@UseGuards(StaffAccessGuard)
	replaceConfig(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateConfigDto
	) {
		return this.merchantService.replace(id, dto.config);
	}

	@Post('launch/:id')
	@HttpCode(200)
	@Serialize(PluginActionResponseDto)
	@UseGuards(StaffAccessGuard)
	launchPlugin(@Param('id', ParseIntPipe) id: number) {
		return this.merchantService.launch(id);
	}

	@Post('disable/:id')
	@HttpCode(200)
	@Serialize(PluginActionResponseDto)
	@UseGuards(StaffAccessGuard)
	disablePlugin(@Param('id', ParseIntPipe) id: number) {
		return this.merchantService.disable(id);
	}

	@Delete(':id')
	@HttpCode(204)
	@UseGuards(StaffAccessGuard)
	removePlugin(@Param('id', ParseIntPipe) id: number) {
		return this.merchantService.remove(id);
	}

	@Get('all')
	@Serialize(PluginListDto)
	@UseGuards(StaffAccessGuard)
	getListOfPlugins(@Query('code') code?: string) {
		return this.merchantService.getList(code);
	}

	@Get(':id')
	@Serialize(MerchantDetailResponseDto)
	@UseGuards(StaffAccessGuard)
	getPlugin(@Param('id', ParseIntPipe) id: number) {
		return this.merchantService.getOne(id);
	}

	@Post('webhook/:id')
	@HttpCode(200)
	handleWebhook(
		@Param('id', ParseIntPipe) id: number,
		@Body() body: any,
		@Headers() headers: Record<string, string>
	) {
		return this.merchantService.handleWebhook(id, body, headers);
	}
}
