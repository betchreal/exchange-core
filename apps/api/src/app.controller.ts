import {
	BadRequestException,
	Controller,
	Get,
	NotFoundException,
	Param
} from '@nestjs/common';
import { AppService } from './app.service';
import { MerchantService } from './merchant/merchant.service';
import { PayoutService } from './payout/payout.service';

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private readonly merchantService: MerchantService,
		private readonly payoutService: PayoutService
	) {}

	@Get('ping')
	ping(): string {
		return this.appService.ping();
	}

	@Get(':endpoint')
	async verifyPluginWebhook(@Param('endpoint') endpoint: string) {
		console.log(endpoint);
		const merchant =
			await this.merchantService.findForVerification(endpoint);
		if (merchant) {
			try {
				return this.merchantService.getVerificationData(merchant.id);
			} catch {
				const payout =
					await this.payoutService.findForVerification(endpoint);
				if (payout) {
					try {
						return this.payoutService.getVerificationData(
							payout.id
						);
					} catch {
						throw new NotFoundException();
					}
				}
				throw new NotFoundException();
			}
		}
		const payout = await this.payoutService.findForVerification(endpoint);
		if (payout) {
			try {
				return this.payoutService.getVerificationData(payout.id);
			} catch {
				throw new NotFoundException();
			}
		}
		throw new NotFoundException();
	}
}
