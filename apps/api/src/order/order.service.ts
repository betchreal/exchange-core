import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Repository } from 'typeorm';
import { OrderEvent } from './entities/order-event.entity';

@Injectable()
export class OrderService {
	constructor(
		@InjectRepository(Order) private readonly order: Repository<Order>,
		@InjectRepository(OrderEvent)
		private readonly orderEvent: Repository<OrderEvent>
	) {}
}
