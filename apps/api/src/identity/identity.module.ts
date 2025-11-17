import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { IdentityService } from './identity.service';
import { Principal } from './entities/principal.entity';
import { Session } from './entities/session.entity';
import { JwtStaffAccessStrategy } from './strategies/jwt-staff-access.strategy';
import { JwtStaffRefreshStrategy } from './strategies/jwt-staff-refresh.strategy';
import { StaffAccessGuard } from './guards/staff-access.guard';
import { StaffRefreshGuard } from './guards/staff.refresh.guard';

@Module({
	imports: [
		TypeOrmModule.forFeature([Principal, Session]),
		JwtModule.register({})
	],
	providers: [
		IdentityService,
		JwtStaffAccessStrategy,
		JwtStaffRefreshStrategy,
		StaffAccessGuard,
		StaffRefreshGuard
	],
	exports: [IdentityService, StaffAccessGuard, StaffRefreshGuard]
})
export class IdentityModule {}
