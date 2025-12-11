import { FieldListEditor } from "../../../../../components/FieldListEditor";
import type { FieldsState } from "../page";

type StepThreeFieldsProps = {
  fields: FieldsState;
  setFields: React.Dispatch<React.SetStateAction<FieldsState>>;
};

export function StepThreeFields({ fields, setFields }: StepThreeFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <FieldListEditor
          title={"Extra Fields"}
          fields={fields.extra}
          onChange={(newFields) =>
            setFields((prev) => ({
              ...prev,
              extra: newFields,
            }))
          }
        />
      </div>
    </div>
  );
}
