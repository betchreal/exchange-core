import {
	Injectable,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import {
	type SessionContext,
	type BasePayload,
	type StaffPayload,
	PrincipalType
} from '@exchange-core/common';
import { Principal } from './entities/principal.entity';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import bcrypt from 'bcrypt';

@Injectable()
export class IdentityService {
	constructor(
		@InjectRepository(Principal)
		private readonly principal: Repository<Principal>,
		@InjectRepository(Session)
		private readonly session: Repository<Session>,
		private readonly jwt: JwtService,
		private readonly cfg: ConfigService
	) {}

	async createPrincipal(consumer: PrincipalType) {
		return this.principal.save(this.principal.create({ type: consumer }));
	}

	async getPrincipal(id: number) {
		const principal = await this.principal.findOne({
			where: { id },
			relations: ['staff', 'customer']
		});
		if (!principal) throw new NotFoundException('Principal not found.');
		return principal;
	}

	async createSession(
		consumer: PrincipalType,
		principalId: number,
		ctx: SessionContext
	) {
		const sessionId = randomUUID();

		if (consumer === PrincipalType.GUEST) {
			await this.session.save({
				id: sessionId,
				ip: ctx.ip,
				ua: ctx.ua,
				principal: {
					id: principalId
				}
			});
			return;
		}

		const basePayload: BasePayload = {
			sub: principalId,
			sid: sessionId,
			consumer
		} as const;

		const jwtCfg = this.getJwtConfig(consumer);
		const payload = this.getPayload(basePayload, ctx);

		const [access, refresh] = await Promise.all([
			this.jwt.signAsync(payload, {
				secret: jwtCfg.access.secret,
				expiresIn: jwtCfg.access.expiresIn
			}),
			this.jwt.signAsync(basePayload, {
				secret: jwtCfg.refresh.secret,
				expiresIn: jwtCfg.refresh.expiresIn
			})
		]);

		await this.session.save({
			hashedRefreshToken: await this.hash(refresh),
			id: sessionId,
			ip: ctx.ip,
			ua: ctx.ua,
			principal: {
				id: principalId
			}
		});

		return { access, refresh };
	}

	async refresh(
		consumer: PrincipalType.EMPLOYEE | PrincipalType.CUSTOMER,
		user: BasePayload,
		token: string,
		ctx: SessionContext
	) {
		const session = await this.session.findOne({
			where: {
				id: user.sid
			}
		});
		if (!session || !session.hashedRefreshToken)
			throw new UnauthorizedException('Session not found.');

		if (!(await this.compare(token, session.hashedRefreshToken)))
			throw new UnauthorizedException('Invalid token.');

		const basePayload: BasePayload = {
			sub: user.sub,
			sid: user.sid,
			consumer
		} as const;

		const jwtCfg = this.getJwtConfig(consumer);
		const payload = this.getPayload(basePayload, ctx);

		const [access, refresh] = await Promise.all([
			this.jwt.signAsync(payload, {
				secret: jwtCfg.access.secret,
				expiresIn: jwtCfg.access.expiresIn
			}),
			this.jwt.signAsync(basePayload, {
				secret: jwtCfg.refresh.secret,
				expiresIn: jwtCfg.refresh.expiresIn
			})
		]);

		session.hashedRefreshToken = await this.hash(refresh);

		await this.session.save(session);

		return { access, refresh };
	}

	async revokeSession(sessionId: string) {
		const session = await this.session.findOne({
			where: {
				id: sessionId
			}
		});

		if (!session) return;

		if (session.hashedRefreshToken !== null) {
			session.hashedRefreshToken = null;
			await this.session.save(session);
		}
	}

	private getJwtConfig(
		consumer: PrincipalType.EMPLOYEE | PrincipalType.CUSTOMER
	) {
		return consumer === PrincipalType.EMPLOYEE
			? {
					access: {
						secret: this.cfg.getOrThrow('STAFF_ACCESS_SECRET'),
						expiresIn: this.cfg.getOrThrow('STAFF_ACCESS_TTL')
					},
					refresh: {
						secret: this.cfg.getOrThrow('STAFF_REFRESH_SECRET'),
						expiresIn: this.cfg.getOrThrow('STAFF_REFRESH_TTL')
					}
				}
			: {
					access: {
						secret: this.cfg.getOrThrow('CUSTOMER_ACCESS_SECRET'),
						expiresIn: this.cfg.getOrThrow('CUSTOMER_ACCESS_TTL')
					},
					refresh: {
						secret: this.cfg.getOrThrow('CUSTOMER_REFRESH_SECRET'),
						expiresIn: this.cfg.getOrThrow('CUSTOMER_REFRESH_TTL')
					}
				};
	}

	private getPayload(
		basePayload: any,
		ctx: SessionContext
	): StaffPayload | BasePayload {
		return basePayload.consumer === PrincipalType.EMPLOYEE
			? { ...basePayload, role: ctx.role }
			: basePayload;
	}

	private async hash(token: string) {
		const digest = createHash('sha256')
			.update(token, 'utf8')
			.digest('base64url');
		return bcrypt.hash(digest, Number(this.cfg.getOrThrow('SALT')));
	}

	private async compare(token: string, encrypted: string) {
		const digest = createHash('sha256')
			.update(token, 'utf8')
			.digest('base64url');
		return bcrypt.compare(digest, encrypted);
	}

	async getLatestSession(principalId: number) {
		return this.session.findOne({
			where: { principal: { id: principalId } },
			order: { createdAt: 'DESC' }
		});
	}
}
