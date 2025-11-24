import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	ParseIntPipe,
	Patch,
	Post
} from '@nestjs/common';
import { RouteService } from './route.service';
import { CreateRouteDto } from './dtos/create-route.dto';
import { UpdateRouteDto } from './dtos/update-route.dto';
import { Serialize } from '../shared/decorators/serialize.decorator';
import { RouteResponseDto } from './dtos/route-response.dto';

@Controller('route')
export class RouteController {
	constructor(private readonly routeService: RouteService) {}

	@Post()
	@Serialize(RouteResponseDto)
	createRoute(@Body() dto: CreateRouteDto) {
		return this.routeService.create(dto);
	}

	@Patch(':id')
	@Serialize(RouteResponseDto)
	updateRoute(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateRouteDto
	) {
		return this.routeService.update(id, dto);
	}

	@Delete(':id')
	@HttpCode(204)
	removeRoute(@Param('id', ParseIntPipe) id: number) {
		return this.routeService.remove(id);
	}

	@Get(':id')
	@Serialize(RouteResponseDto)
	getRoute(@Param('id', ParseIntPipe) id: number) {
		return this.routeService.getOne(id);
	}
}
