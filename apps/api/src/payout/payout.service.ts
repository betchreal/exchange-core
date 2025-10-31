import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Payout } from './entities/payout.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PayoutService {
	constructor(
		@InjectRepository(Payout) private readonly payout: Repository<Payout>
	) {}
}
