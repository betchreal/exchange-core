import { OrderStatus } from "../enums/order-status.enum";
import { PaymentDetailsReponse } from "./payment-details-response.type";

export type OrderSseEvent = {
  status: OrderStatus;
  paymentDetails?: PaymentDetailsReponse;
  confirmations?: {
    actual: number;
    required: number;
  };
};
