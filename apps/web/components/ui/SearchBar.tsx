"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Search } from "lucide-react";

type SearchBarProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ label, className, onChange, ...rest }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-700">{label}</label>
        )}
        <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            onChange={onChange}
            ref={ref}
            className={[
              "ml-3 w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...rest}
          />
        </div>
      </div>
    );
  },
);

SearchBar.displayName = "SearchBar";
