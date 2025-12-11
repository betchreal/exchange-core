import { Field } from "./field.type";

export type FieldWithSource = Field & {
  source: "currency" | "route" | "plugin";
};

export type FormFields = {
  deposit: FieldWithSource[];
  withdraw: FieldWithSource[];
  extra: FieldWithSource[];
};
