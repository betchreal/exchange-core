import {
	Body,
	Controller,
	Get,
	Headers,
	Ip,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	Sse,
	UseGuards
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';
import { CurrentStaff } from '../staff/decorators/current-staff.decorator';
import { Staff } from '../staff/entities/staff.entity';
import { StaffAccessGuard } from '../identity/guards/staff-access.guard';
import { StaffGuard } from '../staff/guards/staff.guard';
import { Serialize } from '../shared/decorators/serialize.decorator';
import { OrderDetailsClientDto } from './dtos/order-details-client.dto';
import { GetOrdersQueryDto } from './dtos/get-orders-query.dto';
import { OrdersListResponseDto } from './dtos/orders-list-response.dto';
import { OrderDetailsAdminDto } from './dtos/order-details-admin.dto';
import { OrderEventDto } from './dtos/order-event.dto';

@Controller('order')
export class OrderController {
	constructor(private readonly orderService: OrderService) {}

	@Post()
	@Serialize(OrderDetailsClientDto)
	createOrder(
		@Body() dto: CreateOrderDto,
		@Ip() ip?: string,
		@Headers('user-agent') ua?: string
	) {
		return this.orderService.create(dto, { ip, ua });
	}

	@Sse('subscribe/:id')
	subscribeToOrderEvents(@Param('id', ParseIntPipe) id: number) {
		return this.orderService.subscribe(id);
	}

	@Post('confirm/:id')
	@Serialize(OrderDetailsClientDto)
	confirmOrder(@Param('id', ParseIntPipe) id: number) {
		return this.orderService.confirm(id);
	}

	@Patch(':id')
	@UseGuards(StaffAccessGuard, StaffGuard)
	updateOrder(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateOrderDto,
		@CurrentStaff() staff: Staff
	) {
		return this.orderService.update(id, dto, staff);
	}

	@Get('all')
	@UseGuards(StaffAccessGuard)
	@Serialize(OrdersListResponseDto)
	getOrders(@Query() query: GetOrdersQueryDto) {
		return this.orderService.getList(
			query.page,
			query.limit,
			query.status,
			query.search
		);
	}

	@Get(':id/staff')
	@UseGuards(StaffAccessGuard)
	@Serialize(OrderDetailsAdminDto)
	getOrderForStaff(@Param('id', ParseIntPipe) id: number) {
		return this.orderService.getOneForStaff(id);
	}

	@Get(':id/events')
	@UseGuards(StaffAccessGuard)
	@Serialize(OrderEventDto)
	getOrderEvents(@Param('id', ParseIntPipe) id: number) {
		return this.orderService.getEvents(id);
	}

	@Get(':id')
	@Serialize(OrderDetailsClientDto)
	getOrderForClient(@Param('id', ParseIntPipe) id: number) {
		return this.orderService.getOne(id);
	}
}
