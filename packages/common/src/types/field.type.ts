import { FieldType } from "../enums/field-type.enum";
import { FieldValidator } from "../enums/field-validator.enum";

export type Field = {
  id?: string;
  label: string;
  hint: string;
  type?: FieldType;
  validator: FieldValidator | string;
};
