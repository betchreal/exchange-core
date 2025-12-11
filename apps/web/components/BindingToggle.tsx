"use client";

type BindingToggleProps = {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
};

export function BindingToggle({
  label,
  options,
  value,
  onChange,
}: BindingToggleProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={[
                "px-3 py-1 rounded-md transition",
                active
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-500 hover:text-slate-900",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
