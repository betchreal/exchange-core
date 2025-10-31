export type FormValue = {
  label: string;
  value: string;
  source: "currency" | "route" | "plugin";
};

export type FormValues = {
  deposit: FormValue[];
  withdraw: FormValue[];
  extra: FormValue[];
};
