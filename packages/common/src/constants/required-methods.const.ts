import { Manifest } from "../types/manifest.type";
import { PayoutMethod } from "../enums/payout-method.enum";
import { MerchantMethod } from "../enums/merchant-method.enum";
import { ParserMethod } from "../enums/parser-method.enum";
import { AmlMethod } from "../enums/aml-method.enum";

export const REQUIRED_METHODS: Record<
  string,
  (m: Manifest) => readonly string[]
> = {
  payout: (m) =>
    m.webhook?.supported
      ? ([
          PayoutMethod.GET_FIELDS,
          PayoutMethod.TRANSFER,
          PayoutMethod.WEBHOOK_HANDLER,
          PayoutMethod.GET_VERIFICATION_DATA,
        ] as const)
      : ([
          PayoutMethod.GET_FIELDS,
          PayoutMethod.TRANSFER,
          PayoutMethod.CHECK_STATUS,
        ] as const),

  merchant: (m) =>
    [
      MerchantMethod.GET_FIELDS,
      MerchantMethod.GET_PAYMENT_DETAILS,
      MerchantMethod.WEBHOOK_HANDLER,
      MerchantMethod.GET_VERIFICATION_DATA,
    ] as const,

  parser: () => [ParserMethod.UPDATE_RATES] as const,

  aml: () => [AmlMethod.CHECK_ADDRESS] as const,
} as const;
