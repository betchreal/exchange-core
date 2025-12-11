"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Field, FieldValidator } from "@exchange-core/common";

export type EditableField = Pick<Field, "label" | "hint" | "validator">;

type FieldListEditorProps = {
  title: string;
  fields: EditableField[];
  onChange: (next: EditableField[]) => void;
};

export function FieldListEditor({
  title,
  fields,
  onChange,
}: FieldListEditorProps) {
  const updateField = (index: number, patch: Partial<EditableField>) => {
    onChange(
      fields.map((field, idx) =>
        idx === index ? { ...field, ...patch } : field,
      ),
    );
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, idx) => idx !== index));
  };

  const addField = () => {
    onChange([...fields, { label: "", hint: "", validator: "" }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <Button type="button" variant="outline" onClick={addField}>
          Add field
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-slate-500">No fields added yet.</p>
      )}

      {fields.map((field, idx) => (
        <div
          key={`${title}-${idx}`}
          className="rounded-xl border border-slate-200 p-4 space-y-3"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Label"
              value={field.label}
              onChange={(e) => updateField(idx, { label: e.target.value })}
              required
            />
            <Input
              label="Hint"
              value={field.hint}
              onChange={(e) => updateField(idx, { hint: e.target.value })}
              required
            />
          </div>
          <Select
            label="Validator"
            value={field.validator}
            onChange={(e) => updateField(idx, { validator: e.target.value })}
            options={[
              { label: "Select validator", value: "" },
              ...Object.entries(FieldValidator).map(([name, value]) => ({
                label: name,
                value,
              })),
            ]}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => removeField(idx)}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
