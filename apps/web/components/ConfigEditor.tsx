"use client";

import { Fragment } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";

export type JsonSchema = {
  type?: "object" | "string" | "number" | "integer" | "boolean";
  title?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  enum?: Array<string | number>;
};

type ConfigEditorProps = {
  schema?: JsonSchema | null;
  value?: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  emptyMessage?: string;
};

const updateNestedValue = (
  source: Record<string, any>,
  path: string[],
  nextValue: unknown,
): Record<string, any> => {
  if (!path.length) return source;
  const [head, ...rest] = path;

  if (!rest.length) {
    return { ...source, [head]: nextValue };
  }

  const current = source?.[head];
  const next = current && typeof current === "object" ? current : {};

  return {
    ...source,
    [head]: updateNestedValue(next, rest, nextValue),
  };
};

const getNestedValue = (
  source: Record<string, any> | undefined,
  path: string[],
) => path.reduce<any>((acc, key) => (acc == null ? acc : acc[key]), source);

export function ConfigEditor({
  schema,
  value,
  onChange,
  emptyMessage = `No data required, just press 'Update Config' button`,
}: ConfigEditorProps) {
  const currentValue = value ?? {};

  const setFieldValue = (path: string[], val: unknown) => {
    onChange(updateNestedValue(currentValue, path, val));
  };

  if (!schema) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  const renderPrimitiveField = (
    fieldKey: string,
    fieldSchema: JsonSchema,
    path: string[],
    required?: boolean,
  ) => {
    const existingValue = getNestedValue(currentValue, path);
    const baseLabel = fieldSchema.title ?? fieldKey;

    if (fieldSchema.enum && fieldSchema.enum.length) {
      const isNumericEnum = fieldSchema.enum.every(
        (opt) => typeof opt === "number",
      );

      const options = [
        { value: "", label: "Select value", disabled: true },
        ...fieldSchema.enum.map((opt) => ({
          value: String(opt),
          label: String(opt),
        })),
      ];

      return (
        <Select
          key={path.join(".")}
          label={baseLabel + (required ? " *" : "")}
          helperText={fieldSchema.description}
          value={existingValue ?? ""}
          onChange={(e) =>
            setFieldValue(
              path,
              e.target.value === ""
                ? ""
                : isNumericEnum
                  ? Number(e.target.value)
                  : e.target.value,
            )
          }
          options={options}
        />
      );
    }

    if (fieldSchema.type === "boolean") {
      return (
        <Checkbox
          key={path.join(".")}
          label={baseLabel + (required ? " *" : "")}
          helperText={fieldSchema.description}
          checked={Boolean(existingValue)}
          onChange={(e) => setFieldValue(path, e.target.checked)}
        />
      );
    }

    const inputType =
      fieldSchema.type === "number" || fieldSchema.type === "integer"
        ? "number"
        : "text";

    return (
      <Input
        key={path.join(".")}
        label={baseLabel + (required ? " *" : "")}
        helperText={fieldSchema.description}
        type={inputType}
        value={existingValue ?? ""}
        onChange={(e) =>
          setFieldValue(
            path,
            inputType === "number" && e.target.value !== ""
              ? Number(e.target.value)
              : e.target.value,
          )
        }
      />
    );
  };

  const renderSchemaFields = (node: JsonSchema, path: string[] = []) => {
    if (node.type === "object" && node.properties) {
      return (
        <div className="space-y-4">
          {Object.entries(node.properties).map(([key, child]) => {
            const nextPath = [...path, key];
            const isRequired = node.required?.includes(key);

            if (child.type === "object") {
              return (
                <div
                  key={nextPath.join(".")}
                  className="rounded-lg border border-slate-200 p-4 space-y-3"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {child.title ?? key}
                  </p>
                  {renderSchemaFields(child, nextPath)}
                </div>
              );
            }

            return renderPrimitiveField(key, child, nextPath, isRequired);
          })}
        </div>
      );
    }

    return renderPrimitiveField(path[path.length - 1] ?? "value", node, path);
  };

  if (
    schema.type !== "object" ||
    !schema.properties ||
    !Object.keys(schema.properties).length
  ) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return <Fragment>{renderSchemaFields(schema)}</Fragment>;
}
