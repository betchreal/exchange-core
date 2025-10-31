import { Module } from '@nestjs/common';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { CurrencyCodeBootstrap } from './bootstrap/currency-code.bootstrap';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Currency } from './entities/currency.entity';
import { CurrencyCode } from './entities/currency-code.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Currency, CurrencyCode])],
	controllers: [CurrencyController],
	providers: [CurrencyService, CurrencyCodeBootstrap]
})
export class CurrencyModule {}
