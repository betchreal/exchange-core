"use client";

import { FieldListEditor } from "../../../../../components/FieldListEditor";
import type { FieldsState } from "../page";

type Step2FieldsProps = {
  fields: FieldsState;
  setFields: React.Dispatch<React.SetStateAction<FieldsState>>;
};

export function StepTwoFields({ fields, setFields }: Step2FieldsProps) {
  return (
    <div className="space-y-6">
      <FieldListEditor
        title="Deposit fields"
        fields={fields.deposit}
        onChange={(list) => setFields((prev) => ({ ...prev, deposit: list }))}
      />
      <FieldListEditor
        title="Withdraw fields"
        fields={fields.withdraw}
        onChange={(list) => setFields((prev) => ({ ...prev, withdraw: list }))}
      />
    </div>
  );
}
