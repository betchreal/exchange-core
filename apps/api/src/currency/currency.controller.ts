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
import { CurrencyService } from './currency.service';
import { CreateCurrencyDto } from './dtos/create-currency.dto';
import { UpdateCurrencyDto } from './dtos/update-currency.dto';
import { Serialize } from '../shared/decorators/serialize.decorator';
import { CurrencyResponseDto } from './dtos/currency-response.dto';

@Controller('currency')
export class CurrencyController {
	constructor(private readonly currencyService: CurrencyService) {}

	@Post()
	@Serialize(CurrencyResponseDto)
	createCurrency(@Body() dto: CreateCurrencyDto) {
		return this.currencyService.create(dto);
	}

	@Patch(':id')
	@Serialize(CurrencyResponseDto)
	updateCurrency(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateCurrencyDto
	) {
		return this.currencyService.update(id, dto);
	}

	@Delete(':id')
	@HttpCode(204)
	removeCurrency(@Param('id', ParseIntPipe) id: number) {
		return this.currencyService.remove(id);
	}

	@Get(':id')
	@Serialize(CurrencyResponseDto)
	getCurrency(@Param('id', ParseIntPipe) id: number) {
		return this.currencyService.getOne(id);
	}
}
