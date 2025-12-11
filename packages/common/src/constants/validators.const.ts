import { FieldValidator } from "../enums/field-validator.enum";

type ValidatorFunction = (value: string) => boolean;

export const Validators: Record<FieldValidator, ValidatorFunction> = {
  [FieldValidator.NV]: () => true,

  [FieldValidator.EMAIL]: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  [FieldValidator.PHONE]: (value: string) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(value.replace(/[\s\-()]/g, ""));
  },

  [FieldValidator.URL]: (value: string) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  },

  [FieldValidator.TELEGRAM]: (value: string) => {
    const cleaned = value.startsWith("@") ? value.slice(1) : value;
    const telegramRegex = /^[a-zA-Z0-9_]{5,32}$/;
    return telegramRegex.test(cleaned);
  },

  [FieldValidator.ALPHA]: (value: string) => {
    const alphaRegex = /^[a-zA-Z\s]+$/;
    return alphaRegex.test(value);
  },

  [FieldValidator.ALPHANUMERIC]: (value: string) => {
    const alphanumericRegex = /^[a-zA-Z0-9\s]+$/;
    return alphanumericRegex.test(value);
  },

  [FieldValidator.NUMERIC]: (value: string) => {
    const numericRegex = /^[0-9]+$/;
    return numericRegex.test(value);
  },
};
