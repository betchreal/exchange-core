import { OrderStatus } from "../enums/order-status.enum";

export type PayoutWebhookResponse = {
  txId: string;
  status:
    | OrderStatus.IN_PAYOUT
    | OrderStatus.SUCCESS
    | OrderStatus.ERROR_PAYOUT;
};
