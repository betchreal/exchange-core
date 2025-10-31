import { Controller } from '@nestjs/common';
import { MerchantService } from './merchant.service';

@Controller('merchant')
export class MerchantController {
	constructor(private readonly merchantService: MerchantService) {}
}
