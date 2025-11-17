import { Controller, Param, Post } from '@nestjs/common';

@Controller('plugin')
export class PluginCoreController {
	constructor() {}

	@Post('payout/:id')
	handlePayoutWebhook(@Param('id') id: number) {}

	@Post('merchant/:id')
	handleMerchantWebhook(@Param('id') id: number) {}
}
