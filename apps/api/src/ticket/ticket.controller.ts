import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { IssueTicketDto } from './dtos/issue-ticket.dto';
import { StaffAccessGuard } from '../identity/guards/staff-access.guard';

@Controller('ticket')
@UseGuards(StaffAccessGuard)
export class TicketController {
	constructor(private readonly ticketService: TicketService) {}

	@Post()
	issueTicket(@Body() dto: IssueTicketDto) {
		return this.ticketService.issue(dto.name, dto.version, dto.type);
	}
}
