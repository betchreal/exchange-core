import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TicketService {
	constructor(
		@InjectRepository(Ticket) private readonly ticket: Repository<Ticket>
	) {}
}
