import { Module } from '@nestjs/common';
import { AmlController } from './aml.controller';
import { AmlService } from './aml.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aml } from './entities/aml.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Aml])],
	controllers: [AmlController],
	providers: [AmlService]
})
export class AmlModule {}
