import Decimal from "decimal.js";
import { ValueTransformer } from "typeorm";

export class NumericTransformer implements ValueTransformer {
  to(value: Decimal | null): string | null {
    if (value === null || value === undefined) return null;
    return value.toString();
  }

  from(value: string): Decimal | null {
    if (value === null || value === undefined) return null;
    return new Decimal(value);
  }
}
