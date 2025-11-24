import { forwardRef, Module } from '@nestjs/common';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { CurrencyCodeBootstrap } from './bootstrap/currency-code.bootstrap';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Currency } from './entities/currency.entity';
import { CurrencyCode } from './entities/currency-code.entity';
import { PayoutModule } from '../payout/payout.module';
import { MerchantModule } from '../merchant/merchant.module';
import { AmlModule } from '../aml/aml.module';
import { RouteModule } from '../route/route.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([Currency, CurrencyCode]),
		forwardRef(() => RouteModule),
		forwardRef(() => PayoutModule),
		forwardRef(() => MerchantModule),
		forwardRef(() => AmlModule)
	],
	controllers: [CurrencyController],
	providers: [CurrencyService, CurrencyCodeBootstrap],
	exports: [CurrencyService]
})
export class CurrencyModule {}
