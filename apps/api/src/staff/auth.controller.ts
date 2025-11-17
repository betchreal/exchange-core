import {
	Body,
	Controller,
	Headers,
	HttpCode,
	Ip,
	Post,
	Req,
	Res,
	UseGuards
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { AuthService } from './auth.service';
import { LoginEmployeeDto } from './dtos/login-employee.dto';
import { StaffRefreshGuard } from '../identity/guards/staff.refresh.guard';
import { StaffAccessGuard } from '../identity/guards/staff-access.guard';
import { CurrentUser } from '../identity/decorators/current-user.decorator';
import { type BasePayload, type StaffPayload } from '@exchange-core/common';
import ms from 'ms';
import { ConfigService } from '@nestjs/config';

@Controller('auth/staff')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly cfg: ConfigService
	) {}

	@Post('login')
	async login(
		@Body() dto: LoginEmployeeDto,
		@Res({ passthrough: true }) res: Response,
		@Ip() ip?: string,
		@Headers('user-agent') ua?: string
	) {
		const { access, refresh } = await this.authService.login(dto, ip, ua);
		res.cookie('rt-staff', refresh, {
			httpOnly: true,
			secure: true,
			sameSite: 'none',
			path: '/auth/staff/refresh',
			maxAge: Number(ms(this.cfg.getOrThrow('STAFF_REFRESH_TTL')))
		});
		return { access };
	}

	@Post('refresh')
	@UseGuards(StaffRefreshGuard)
	async refresh(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@CurrentUser() user: BasePayload
	) {
		const { access, refresh } = await this.authService.refresh(
			req.cookies['rt-staff'],
			user
		);
		res.cookie('rt-staff', refresh, {
			httpOnly: true,
			secure: true,
			sameSite: 'none',
			path: '/auth/staff/refresh',
			maxAge: Number(ms(this.cfg.getOrThrow('STAFF_REFRESH_TTL')))
		});
		return { access };
	}

	@Post('logout')
	@UseGuards(StaffAccessGuard)
	@HttpCode(204)
	async logout(
		@Res({ passthrough: true }) res: Response,
		@CurrentUser() user: StaffPayload
	) {
		await this.authService.logout(user);
		res.clearCookie('rt-staff', {
			httpOnly: true,
			secure: true,
			sameSite: 'none',
			path: '/auth/staff/refresh'
		});
	}
}
