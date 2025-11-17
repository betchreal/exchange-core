import { Body, Controller, Post } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { IssueTicketDto } from './dtos/issue-ticket.dto';

@Controller('ticket')
export class TicketController {
	constructor(private readonly ticketService: TicketService) {}

	@Post()
	issueTicket(@Body() dto: IssueTicketDto) {
		return this.ticketService.issue(dto.name, dto.version, dto.type);
	}
}
