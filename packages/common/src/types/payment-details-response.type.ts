export type PaymentDetail = {
  label: string;
  value: string;
};

export type PaymentDetailsReponse = {
  details: PaymentDetail[];
  identifier: string;
};
