import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-labs/nestjs-ioredis';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AmlModule } from './aml/aml.module';
import { CurrencyModule } from './currency/currency.module';
import { CustomerModule } from './customer/customer.module';
import { IdentityModule } from './identity/identity.module';
import { MerchantModule } from './merchant/merchant.module';
import { OrderModule } from './order/order.module';
import { ParserModule } from './parser/parser.module';
import { PayoutModule } from './payout/payout.module';
import { PluginCoreModule } from './plugin-core/plugin-core.module';
import { RouteModule } from './route/route.module';
import { SettingModule } from './setting/setting.module';
import { SharedModule } from './shared/shared.module';
import { StaffModule } from './staff/staff.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true
			// validationSchema !
		}),
		TypeOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (cfg: ConfigService) => ({
				type: 'postgres',
				host: cfg.getOrThrow<string>('DB_HOST'),
				database: cfg.getOrThrow<string>('DB_NAME'),
				port: +cfg.getOrThrow<number>('DB_PORT'),
				username: cfg.getOrThrow('DB_USER'),
				password: cfg.getOrThrow<string>('DB_PASSWORD'),
				autoLoadEntities: true,
				synchronize: true
			})
		}),
		RedisModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (cfg: ConfigService) => ({
				readyLog: true,
				config: {
					host: cfg.getOrThrow<string>('REDIS_HOST'),
					port: +cfg.getOrThrow<number>('REDIS_PORT'),
					password: cfg.getOrThrow<string>('REDIS_PASSWORD'),
					db: cfg.getOrThrow<number>('REDIS_DB')
				}
			})
		}),
		ScheduleModule.forRoot(),
		EventEmitterModule.forRoot(),
		AmlModule,
		CurrencyModule,
		CustomerModule,
		IdentityModule,
		MerchantModule,
		OrderModule,
		ParserModule,
		PayoutModule,
		PluginCoreModule,
		RouteModule,
		SettingModule,
		SharedModule,
		StaffModule,
		TicketModule
	],
	controllers: [AppController],
	providers: [AppService]
})
export class AppModule {}
