import { Module } from '@nestjs/common';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parser } from './entities/parser.entity';
import { PluginCoreModule } from '../plugin-core/plugin-core.module';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { pluginUploadFactory } from '../shared/factories/plugin-upload.factory';
import { PluginType } from '@exchange-core/common';

@Module({
	imports: [
		MulterModule.registerAsync({
			inject: [ConfigService],
			useFactory: pluginUploadFactory(PluginType.PARSER)
		}),
		TypeOrmModule.forFeature([Parser]),
		PluginCoreModule
	],
	controllers: [ParserController],
	providers: [ParserService]
})
export class ParserModule {}
