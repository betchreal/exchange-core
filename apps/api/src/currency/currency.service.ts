import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Currency } from './entities/currency.entity';
import { Repository } from 'typeorm';
import { CurrencyCode } from './entities/currency-code.entity';

@Injectable()
export class CurrencyService {
	constructor(
		@InjectRepository(Currency)
		private readonly currency: Repository<Currency>,
		@InjectRepository(CurrencyCode)
		private readonly currencyCode: Repository<CurrencyCode>
	) {}
}
