import { forwardRef, Module } from '@nestjs/common';
import { PayoutController } from './payout.controller';
import { PayoutService } from './payout.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payout } from './entities/payout.entity';
import { PluginCoreModule } from '../plugin-core/plugin-core.module';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { pluginUploadFactory } from '../shared/factories/plugin-upload.factory';
import { PluginType } from '@exchange-core/common';
import { CurrencyModule } from '../currency/currency.module';
import { RouteModule } from '../route/route.module';

@Module({
	imports: [
		MulterModule.registerAsync({
			inject: [ConfigService],
			useFactory: pluginUploadFactory(PluginType.PAYOUT)
		}),
		TypeOrmModule.forFeature([Payout]),
		forwardRef(() => CurrencyModule),
		forwardRef(() => RouteModule),
		PluginCoreModule
	],
	controllers: [PayoutController],
	providers: [PayoutService],
	exports: [PayoutService]
})
export class PayoutModule {}
