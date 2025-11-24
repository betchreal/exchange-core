import { forwardRef, Module } from '@nestjs/common';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parser } from './entities/parser.entity';
import { PluginCoreModule } from '../plugin-core/plugin-core.module';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { pluginUploadFactory } from '../shared/factories/plugin-upload.factory';
import { PluginType } from '@exchange-core/common';
import { RouteModule } from '../route/route.module';

@Module({
	imports: [
		MulterModule.registerAsync({
			inject: [ConfigService],
			useFactory: pluginUploadFactory(PluginType.PARSER)
		}),
		TypeOrmModule.forFeature([Parser]),
		forwardRef(() => RouteModule),
		PluginCoreModule
	],
	controllers: [ParserController],
	providers: [ParserService],
	exports: [ParserService]
})
export class ParserModule {}
