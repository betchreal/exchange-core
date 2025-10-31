import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { existsSync, promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import type { CurrencyCodePlain } from '@exchange-core/common';
import { CurrencyCode } from '../entities/currency-code.entity';

@Injectable()
export class CurrencyCodeBootstrap implements OnApplicationBootstrap {
	constructor(
		@InjectRepository(CurrencyCode)
		private readonly currencyCode: Repository<CurrencyCode>,
		private readonly cfg: ConfigService
	) {}

	async onApplicationBootstrap() {
		const path = resolve(
			this.cfg.getOrThrow<string>('CURRENCY_CODES_PATH')
		);
		if (!existsSync(path))
			throw new Error('Cannot find currency-codes.json file.');

		let currencyCodes: CurrencyCodePlain[];
		try {
			currencyCodes = JSON.parse(await fs.readFile(path, 'utf-8'));
		} catch {
			throw new Error('currency-code.json is an invalid JSON');
		}

		if (!Array.isArray(currencyCodes))
			throw new Error('currency-codes.json is not an array.');

		for (const code of currencyCodes) {
			if (
				!code.code ||
				!code.description ||
				!/^[A-Z0-9]{1,16}$/.test(code.code) ||
				code.description.length > 64
			)
				throw new Error('Invalid values in currency.json');
		}

		await this.currencyCode.upsert(currencyCodes, ['code']);
	}
}
