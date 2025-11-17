import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { IdentityModule } from '../identity/identity.module';

@Module({
	imports: [TypeOrmModule.forFeature([Staff]), IdentityModule],
	controllers: [StaffController, AuthController],
	providers: [StaffService, AuthService]
})
export class StaffModule {}
