"use client";
import { forwardRef, type SelectHTMLAttributes } from "react";

export type SelectOption<T extends string | number = string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type SelectProps<T extends string | number> =
  SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    helperText?: string;
    errorText?: string;
    options: SelectOption<T>[];
  };

export const Select = forwardRef<HTMLSelectElement, SelectProps<string>>(
  (
    { label, helperText, errorText, options, id, name, className, ...rest },
    ref,
  ) => {
    const selectId = id ?? name;
    const describeId = helperText || errorText ? `${selectId}-desc` : undefined;
    const hasError = Boolean(errorText);

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-slate-800"
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          name={name}
          aria-invalid={hasError}
          aria-describedby={describeId}
          className={[
            "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition",
            hasError
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-slate-300 focus:border-sky-500 focus:ring-sky-500/20",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        >
          {options.map((opt) => (
            <option
              key={String(opt.value)}
              value={opt.value}
              disabled={opt.disabled}
            >
              {opt.label}
            </option>
          ))}
        </select>

        {(helperText || errorText) && (
          <p
            id={describeId}
            className={`text-xs ${
              hasError ? "text-rose-500" : "text-slate-500"
            }`}
          >
            {errorText ?? helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
