import {
	Body,
	Controller, Get,
	Headers,
	HttpCode,
	Ip,
	Post,
	Req,
	Res, UnauthorizedException,
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
import {StaffGuard} from "./guards/staff.guard";
import {CurrentStaff} from "./decorators/current-staff.decorator";
import {Staff} from "./entities/staff.entity";

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
		const result = await this.authService.login(dto, ip, ua);
		res.cookie('at-staff', result.access, {
			httpOnly: true,
			secure: true, // true для https
			sameSite: 'none',
			maxAge: Number(ms(this.cfg.getOrThrow('STAFF_ACCESS_TTL')))
		});
		res.cookie('rt-staff', result.refresh, {
			httpOnly: true,
			secure: true, // true для https
			sameSite: 'none',
			path: '/auth/staff/refresh',
			maxAge: Number(ms(this.cfg.getOrThrow('STAFF_REFRESH_TTL')))
		});
		return result.staff;
	}

	@Post('refresh')
	@UseGuards(StaffRefreshGuard)
	@HttpCode(204)
	async refresh(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
		@CurrentUser() user: BasePayload
	) {
		const { access, refresh } = await this.authService.refresh(
			req.cookies['rt-staff'],
			user
		);
		res.cookie('at-staff', access, {
			httpOnly: true,
			secure: true, // true для https
			sameSite: 'none',
			maxAge: Number(ms(this.cfg.getOrThrow('STAFF_ACCESS_TTL')))
		});
		res.cookie('rt-staff', refresh, {
			httpOnly: true,
			secure: true, // true для https
			sameSite: 'none',
			path: '/auth/staff/refresh',
			maxAge: Number(ms(this.cfg.getOrThrow('STAFF_REFRESH_TTL')))
		});
	}

	@Post('logout')
	@UseGuards(StaffAccessGuard)
	@HttpCode(204)
	async logout(
		@Res({ passthrough: true }) res: Response,
		@CurrentUser() user: StaffPayload
	) {
		await this.authService.logout(user);
		res.clearCookie('at-staff', {
			httpOnly: true,
			secure: true, // true для https
			sameSite: 'none' //!
		});
		res.clearCookie('rt-staff', {
			httpOnly: true,
			secure: true, // true для https
			sameSite: 'none', //!
			path: '/auth/staff/refresh'
		});
	}

	@Get('verify')
	@UseGuards(StaffAccessGuard, StaffGuard)
	@HttpCode(204)
	verifyStaff(@CurrentStaff() staff: Staff) {
		if (!staff) throw new UnauthorizedException();
	}
}
