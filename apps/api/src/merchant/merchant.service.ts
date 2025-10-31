import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Merchant } from './entities/merchant.entity';
import { Repository } from 'typeorm';
import { ManualMerchant } from './entities/manual-merchant.entity';

@Injectable()
export class MerchantService {
	constructor(
		@InjectRepository(Merchant)
		private readonly merchant: Repository<Merchant>,
		@InjectRepository(ManualMerchant)
		private readonly manualMerchant: Repository<ManualMerchant>
	) {}
}
