import { FieldType } from "../enums/field-type.enum";
import { FieldValidator } from "../enums/field-validator.enum";

export type Field = {
  label: string;
  hint: string;
  type?: FieldType;
  validator: FieldValidator | string;
};
