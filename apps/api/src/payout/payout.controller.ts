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
import { FileInterceptor } from '@nestjs/platform-express';
import { PayoutService } from './payout.service';
import { Serialize } from '../shared/decorators/serialize.decorator';
import { UpdateConfigDto } from '../shared/dtos/update-config.dto';
import { PluginActionResponseDto } from '../shared/dtos/plugin-action-response.dto';
import { PayoutDetailResponseDto } from './dtos/payout-detail-response.dto';
import { PayoutInstallResponseDto } from './dtos/payout-install-response.dto';
import { PluginListDto } from '../shared/dtos/plugin-list.dto';
import { StaffAccessGuard } from '../identity/guards/staff-access.guard';

@Controller('payout')
export class PayoutController {
	constructor(private readonly payoutService: PayoutService) {}

	@Post('install')
	@Serialize(PayoutInstallResponseDto)
	@UseInterceptors(FileInterceptor('file'))
	@UseGuards(StaffAccessGuard)
	installPlugin(
		@UploadedFile('file', new ParseFilePipe()) file: Express.Multer.File
	) {
		return this.payoutService.install(file.path, file.originalname);
	}

	@Put('config/:id')
	@HttpCode(204)
	@UseGuards(StaffAccessGuard)
	replaceConfig(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateConfigDto
	) {
		return this.payoutService.replace(id, dto.config);
	}

	@Post('launch/:id')
	@HttpCode(200)
	@Serialize(PluginActionResponseDto)
	@UseGuards(StaffAccessGuard)
	launchPlugin(@Param('id', ParseIntPipe) id: number) {
		return this.payoutService.launch(id);
	}

	@Post('disable/:id')
	@HttpCode(200)
	@Serialize(PluginActionResponseDto)
	@UseGuards(StaffAccessGuard)
	disablePlugin(@Param('id', ParseIntPipe) id: number) {
		return this.payoutService.disable(id);
	}

	@Delete(':id')
	@HttpCode(204)
	@UseGuards(StaffAccessGuard)
	removePlugin(@Param('id', ParseIntPipe) id: number) {
		return this.payoutService.remove(id);
	}

	@Get('all')
	@Serialize(PluginListDto)
	@UseGuards(StaffAccessGuard)
	getListOfPlugins(@Query('code') code: string) {
		return this.payoutService.getList(code);
	}

	@Get(':id')
	@Serialize(PayoutDetailResponseDto)
	@UseGuards(StaffAccessGuard)
	getPlugin(@Param('id', ParseIntPipe) id: number) {
		return this.payoutService.getOne(id);
	}

	@Post('webhook/:id')
	@HttpCode(200)
	handlePluginWebhook(
		@Param('id', ParseIntPipe) id: number,
		@Body() body: any,
		@Headers() headers: Record<string, string>
	) {
		return this.payoutService.handleWebhook(id, body, headers);
	}
}
