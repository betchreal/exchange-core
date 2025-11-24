import { forwardRef, Module } from '@nestjs/common';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from './entities/merchant.entity';
import { ManualMerchant } from './entities/manual-merchant.entity';
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
			useFactory: pluginUploadFactory(PluginType.MERCHANT)
		}),
		TypeOrmModule.forFeature([Merchant, ManualMerchant]),
		forwardRef(() => CurrencyModule),
		forwardRef(() => RouteModule),
		PluginCoreModule
	],
	controllers: [MerchantController],
	providers: [MerchantService],
	exports: [MerchantService]
})
export class MerchantModule {}
