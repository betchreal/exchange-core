import { OrderStatus } from "../enums/order-status.enum";

export const OrderStateMachine: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.NEW]: [
    OrderStatus.NOT_PAID,
    OrderStatus.HOLD,
    OrderStatus.DELETED,
  ],
  [OrderStatus.NOT_PAID]: [
    OrderStatus.PROCESSING,
    OrderStatus.ERROR_PAID,
    OrderStatus.DELETED,
    OrderStatus.IN_PAYOUT,
  ],
  [OrderStatus.PROCESSING]: [
    OrderStatus.NOT_PAID,
    OrderStatus.ERROR_PAID,
    OrderStatus.IN_PAYOUT,
    OrderStatus.HOLD,
    OrderStatus.SUCCESS,
    OrderStatus.RETURNED,
    OrderStatus.DELETED,
  ],
  [OrderStatus.IN_PAYOUT]: [
    OrderStatus.PROCESSING,
    OrderStatus.SUCCESS,
    OrderStatus.HOLD,
    OrderStatus.RETURNED,
    OrderStatus.ERROR_PAYOUT,
  ],
  [OrderStatus.HOLD]: [
    OrderStatus.PROCESSING,
    OrderStatus.SUCCESS,
    OrderStatus.RETURNED,
    OrderStatus.DELETED,
  ],
  [OrderStatus.SUCCESS]: [OrderStatus.RETURNED],
  [OrderStatus.RETURNED]: [OrderStatus.PROCESSING],
  [OrderStatus.ERROR_PAID]: [
    OrderStatus.NOT_PAID,
    OrderStatus.PROCESSING,
    OrderStatus.RETURNED,
    OrderStatus.DELETED,
  ],
  [OrderStatus.ERROR_PAYOUT]: [
    OrderStatus.RETURNED,
    OrderStatus.HOLD,
    OrderStatus.PROCESSING,
    OrderStatus.IN_PAYOUT,
  ],
  [OrderStatus.DELETED]: [OrderStatus.PROCESSING],
};
