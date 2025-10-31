import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEvent } from './entities/order-event.entity';
import { Order } from './entities/order.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Order, OrderEvent])],
	controllers: [OrderController],
	providers: [OrderService]
})
export class OrderModule {}
