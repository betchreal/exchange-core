import { Module } from '@nestjs/common';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from './entities/merchant.entity';
import { ManualMerchant } from './entities/manual-merchant.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Merchant, ManualMerchant])],
	controllers: [MerchantController],
	providers: [MerchantService]
})
export class MerchantModule {}
