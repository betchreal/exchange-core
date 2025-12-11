import { forwardRef, Module } from '@nestjs/common';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from './entities/route.entity';
import { CurrencyModule } from '../currency/currency.module';
import { ParserModule } from '../parser/parser.module';
import { PayoutModule } from '../payout/payout.module';
import { MerchantModule } from '../merchant/merchant.module';
import { AmlModule } from '../aml/aml.module';
import { OrderModule } from '../order/order.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Route]),
		forwardRef(() => OrderModule),
		forwardRef(() => CurrencyModule),
		forwardRef(() => ParserModule),
		forwardRef(() => PayoutModule),
		forwardRef(() => MerchantModule),
		forwardRef(() => AmlModule)
	],
	controllers: [RouteController],
	providers: [RouteService],
	exports: [RouteService]
})
export class RouteModule {}
