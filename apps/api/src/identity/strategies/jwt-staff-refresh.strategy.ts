import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { type Request } from 'express';
import { type BasePayload } from '@exchange-core/common';

const cookieExtractor = (req: Request) => req?.cookies?.['rt-staff'];

@Injectable()
export class JwtStaffRefreshStrategy extends PassportStrategy(
	Strategy,
	'jwt-staff-refresh'
) {
	constructor(cfg: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
			secretOrKey: cfg.getOrThrow('STAFF_REFRESH_SECRET'),
			ignoreExpiration: false
		});
	}

	validate(payload: BasePayload) {
		return payload;
	}
}
