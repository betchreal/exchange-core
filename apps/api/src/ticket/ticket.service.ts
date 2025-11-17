import {
	BadRequestException,
	Injectable,
	InternalServerErrorException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { QueryFailedError, Repository } from 'typeorm';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { SettingService } from '../setting/setting.service';
import {
	MetadataKey,
	PluginType,
	type TicketPayload
} from '@exchange-core/common';
import { randomUUID } from 'node:crypto';

@Injectable()
export class TicketService {
	constructor(
		@InjectRepository(Ticket) private readonly ticket: Repository<Ticket>,
		private readonly metadata: SettingService,
		private readonly jwt: JwtService
	) {}

	async issue(name: string, version: string, type: PluginType) {
		const issuer = await this.metadata.get(MetadataKey.INSTANCE_ID);
		if (!issuer) throw new InternalServerErrorException('No INSTANCE ID');

		const payload: Partial<TicketPayload> = {
			sub: `${name}@${version}`,
			jti: randomUUID(),
			type
		};

		const ticket = await this.jwt.signAsync(payload, { issuer });
		return { ticket };
	}

	async verify(token: string) {
		const issuer = await this.metadata.get(MetadataKey.INSTANCE_ID);
		if (!issuer) throw new InternalServerErrorException('No INSTANCE ID');

		let payload: TicketPayload;
		try {
			payload = await this.jwt.verifyAsync(token, { issuer });
		} catch (err) {
			if (err instanceof TokenExpiredError)
				throw new BadRequestException('Ticket expired.');
			if (err instanceof JsonWebTokenError)
				throw new BadRequestException('Invalid ticket.');

			throw new InternalServerErrorException(
				'Ticket verification failed.'
			);
		}

		const [name, version] = payload.sub.split('@');

		return {
			name,
			version,
			type: payload.type,
			jti: payload.jti,
			exp: payload.exp
		};
	}

	async consume(jti: string, exp: number) {
		const res = await this.ticket
			.createQueryBuilder()
			.insert()
			.into(Ticket)
			.values({ jti, expAt: new Date(exp * 1000) })
			.orIgnore()
			.returning('jti')
			.execute();

		return !!res.raw.length;
	}
}
