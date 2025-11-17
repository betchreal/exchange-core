import { Module } from '@nestjs/common';
import { AmlController } from './aml.controller';
import { AmlService } from './aml.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aml } from './entities/aml.entity';
import { PluginCoreModule } from '../plugin-core/plugin-core.module';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { pluginUploadFactory } from '../shared/factories/plugin-upload.factory';
import { PluginType } from '@exchange-core/common';

@Module({
	imports: [
		MulterModule.registerAsync({
			inject: [ConfigService],
			useFactory: pluginUploadFactory(PluginType.AML)
		}),
		TypeOrmModule.forFeature([Aml]),
		PluginCoreModule
	],
	controllers: [AmlController],
	providers: [AmlService]
})
export class AmlModule {}
