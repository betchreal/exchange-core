"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const variantClasses: Record<Variant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
  outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      disabled,
      className,
      children,
      leftIcon,
      rightIcon,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        {...rest}
        ref={ref}
        disabled={isDisabled}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {leftIcon && <span className="inline-flex">{leftIcon}</span>}
        <span>{loading ? "Loading…" : children}</span>
        {rightIcon && <span className="inline-flex">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
