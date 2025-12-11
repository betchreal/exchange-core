"use client";
import { forwardRef, type InputHTMLAttributes } from "react";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string;
  helperText?: string;
  errorText?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, helperText, errorText, id, name, className, ...rest }, ref) => {
    const checkboxId = id ?? name;
    const describeId =
      helperText || errorText ? `${checkboxId}-desc` : undefined;
    const hasError = Boolean(errorText);

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={checkboxId}
          className="flex items-center gap-2 text-sm font-medium text-slate-800"
        >
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            name={name}
            aria-invalid={hasError}
            aria-describedby={describeId}
            className={[
              "h-4 w-4 rounded border transition",
              hasError
                ? "border-rose-400 text-rose-600 focus:ring-rose-500/20"
                : "border-slate-300 text-slate-900 focus:ring-sky-500/20",
              "focus:ring-2 focus:ring-offset-0",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...rest}
          />
          {label && <span>{label}</span>}
        </label>

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

Checkbox.displayName = "Checkbox";
