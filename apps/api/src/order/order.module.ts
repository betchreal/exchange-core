import { forwardRef, Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEvent } from './entities/order-event.entity';
import { Order } from './entities/order.entity';
import { IdentityModule } from '../identity/identity.module';
import { RouteModule } from '../route/route.module';
import { MerchantModule } from '../merchant/merchant.module';
import { PayoutModule } from '../payout/payout.module';
import { ParserModule } from '../parser/parser.module';
import { AmlModule } from '../aml/aml.module';
import { CurrencyModule } from '../currency/currency.module';
import { StaffModule } from '../staff/staff.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Order, OrderEvent]),
		IdentityModule,
		StaffModule,
		forwardRef(() => CurrencyModule),
		forwardRef(() => RouteModule),
		MerchantModule,
		forwardRef(() => PayoutModule),
		ParserModule,
		forwardRef(() => AmlModule)
	],
	controllers: [OrderController],
	providers: [OrderService],
	exports: [OrderService]
})
export class OrderModule {}
