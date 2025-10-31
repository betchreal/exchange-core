import { Module } from '@nestjs/common';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from './entities/route.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Route])],
	controllers: [RouteController],
	providers: [RouteService]
})
export class RouteModule {}
