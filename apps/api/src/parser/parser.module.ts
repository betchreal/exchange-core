import { Module } from '@nestjs/common';
import { ParserController } from './parser.controller';
import { ParserService } from './parser.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parser } from './entities/parser.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Parser])],
	controllers: [ParserController],
	providers: [ParserService]
})
export class ParserModule {}
