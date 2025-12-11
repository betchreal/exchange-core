import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	UseGuards
} from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CreateCurrencyDto } from './dtos/create-currency.dto';
import { UpdateCurrencyDto } from './dtos/update-currency.dto';
import { GetCurrenciesQueryDto } from './dtos/get-currencies-query.dto';
import { Serialize } from '../shared/decorators/serialize.decorator';
import { CurrencyResponseDto } from './dtos/currency-response.dto';
import { CurrenciesListResponseDto } from './dtos/currencies-list-response.dto';
import { StaffAccessGuard } from '../identity/guards/staff-access.guard';

@Controller('currency')
@UseGuards(StaffAccessGuard)
export class CurrencyController {
	constructor(private readonly currencyService: CurrencyService) {}

	@Get('all')
	@Serialize(CurrenciesListResponseDto)
	getCurrencies(@Query() query: GetCurrenciesQueryDto) {
		return this.currencyService.getList(
			query.search,
			query.page,
			query.limit
		);
	}

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

	@Get('codes')
	getCurrencyCodes() {
		return this.currencyService.getCodes();
	}

	@Get(':id')
	@Serialize(CurrencyResponseDto)
	getCurrency(@Param('id', ParseIntPipe) id: number) {
		return this.currencyService.getOne(id);
	}
}
