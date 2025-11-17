import { Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { IdentityService } from '../identity/identity.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { Repository } from 'typeorm';
import { LoginEmployeeDto } from './dtos/login-employee.dto';
import { type BasePayload, StaffPayload } from '@exchange-core/common';

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(Staff) private readonly staff: Repository<Staff>,
		private readonly identity: IdentityService
	) {}

	async login(dto: LoginEmployeeDto, ip?: string, ua?: string) {
		const employee = await this.staff.findOne({
			where: {
				email: dto.email
			},
			relations: ['principal']
		});

		if (
			!employee ||
			!(await bcrypt.compare(dto.password, employee.passwordHash))
		)
			throw new UnauthorizedException('Invalid credentials.');
		return this.identity.createSession('staff', employee.principal.id, {
			ip,
			ua,
			role: employee.role
		});
	}

	async refresh(token: string, user: BasePayload) {
		if (user.consumer !== 'staff')
			throw new UnauthorizedException('Invalid consumer.');
		const staff = await this.staff.findOne({
			where: {
				principal: {
					id: user.sub
				}
			},
			relations: ['principal']
		});

		if (!staff) throw new UnauthorizedException('Staff not found.');
		return this.identity.refresh('staff', user, token, {
			role: staff.role
		});
	}

	logout(user: StaffPayload) {
		if (user.consumer !== 'staff')
			throw new UnauthorizedException('Invalid consumer.');
		return this.identity.revokeSession(user.sid);
	}
}
