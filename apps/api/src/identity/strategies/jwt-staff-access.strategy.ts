import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { StaffPayload } from '@exchange-core/common';

@Injectable()
export class JwtStaffAccessStrategy extends PassportStrategy(
	Strategy,
	'jwt-staff-access'
) {
	constructor(cfg: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: cfg.getOrThrow('STAFF_ACCESS_SECRET'),
			ignoreExpiration: false
		});
	}

	validate(payload: StaffPayload) {
		return payload;
	}
}
