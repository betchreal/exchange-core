"use client";
import { forwardRef, type InputHTMLAttributes } from "react";

type Variant = "default" | "danger" | "success";
type Size = "md" | "lg";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  errorText?: string;
  size?: Size;
  variant?: Variant;
};

const sizeClasses: Record<string, string> = {
  md: "h-10 px-3 text-sm",
  lg: "h-12 px-4 text-base",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorText,
      size = "md",
      variant = "default",
      className,
      id,
      ...rest
    },
    ref,
  ) => {
    const inputId = id ?? rest.name;
    const describeId = helperText || errorText ? `${inputId}-desc` : undefined;
    const hasError = Boolean(errorText) || variant === "danger";

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-800"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-describedby={describeId}
          aria-invalid={hasError}
          className={[
            "w-full rounded-lg border bg-white shadow-sm outline-none transition",
            sizeClasses[size],
            hasError
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-slate-300 focus:border-sky-500 focus:ring-sky-500/20",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />

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

Input.displayName = "Input";
