import { OrderStatus } from "../enums/order-status.enum";

export const OrderStateMachine: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.NOT_PAID]: [
    OrderStatus.PROCESSING,
    OrderStatus.ERROR_PAID,
    OrderStatus.DELETED,
    OrderStatus.IN_PAYOUT,
  ],
  [OrderStatus.PROCESSING]: [],
  [OrderStatus.IN_PAYOUT]: [],
  [OrderStatus.HOLD]: [],
  [OrderStatus.SUCCESS]: [],
  [OrderStatus.ERROR_PAID]: [],
  [OrderStatus.DELETED]: [],
};
// ...
