"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

export type SwitchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string;
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, id, name, className, checked, ...rest }, ref) => {
    const switchId = id ?? name;

    return (
      <label
        htmlFor={switchId}
        className="inline-flex items-center gap-2 cursor-pointer"
      >
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            name={name}
            checked={checked}
            className="sr-only peer"
            {...rest}
          />
          <div
            className={[
              "w-9 h-5 rounded-full transition-colors",
              "peer-checked:bg-emerald-500 bg-slate-300",
              "peer-focus:ring-2 peer-focus:ring-emerald-500/20",
            ].join(" ")}
          />
          <div
            className={[
              "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform",
              "peer-checked:translate-x-4",
            ].join(" ")}
          />
        </div>
        {label && (
          <span className="text-sm font-medium text-slate-700">{label}</span>
        )}
      </label>
    );
  },
);

Switch.displayName = "Switch";
