import { OrderStatus } from "../enums/order-status.enum";

export type MerchantWebhookResponse = {
  identifier: string;
  amount: string;
  status:
    | OrderStatus.PROCESSING
    | OrderStatus.IN_PAYOUT
    | OrderStatus.ERROR_PAID;
  confirmations: {
    actual: number;
    required: number;
  };
};
