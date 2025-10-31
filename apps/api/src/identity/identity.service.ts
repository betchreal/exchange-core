import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Principal } from './entities/principal.entity';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';

@Injectable()
export class IdentityService {
	constructor(
		@InjectRepository(Principal)
		private readonly principal: Repository<Principal>,
		@InjectRepository(Session) private readonly session: Repository<Session>
	) {}
}
