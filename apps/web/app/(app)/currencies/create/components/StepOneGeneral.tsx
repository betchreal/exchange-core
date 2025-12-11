"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { BasicsState, CodeOption } from "../page";

type Step1GeneralProps = {
  basics: BasicsState;
  setBasics: React.Dispatch<React.SetStateAction<BasicsState>>;
  codeOptions: CodeOption[];
};

export function StepOneGeneral({
  basics,
  setBasics,
  codeOptions,
}: Step1GeneralProps) {
  return (
    <div className="space-y-4">
      <Input
        label="Name"
        value={basics.name}
        onChange={(e) =>
          setBasics((prev) => ({ ...prev, name: e.target.value }))
        }
        required
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Ticker"
          value={basics.ticker}
          onChange={(e) =>
            setBasics((prev) => ({
              ...prev,
              ticker: e.target.value.toUpperCase(),
            }))
          }
          required
        />
        <Input
          label="Precision"
          type="number"
          value={basics.precision}
          onChange={(e) =>
            setBasics((prev) => ({ ...prev, precision: e.target.value }))
          }
          min={0}
          max={18}
        />
      </div>
      <Select
        label="Currency code"
        value={basics.code}
        onChange={(e) =>
          setBasics((prev) => ({
            ...prev,
            code: e.target.value,
          }))
        }
        options={[
          { label: "Select code", value: "" },
          ...codeOptions.map((c) => ({
            label: `${c.description}`,
            value: c.code,
          })),
        ]}
      />
      <Input
        label="Reserve"
        value={basics.reserve}
        onChange={(e) =>
          setBasics((prev) => ({ ...prev, reserve: e.target.value }))
        }
        placeholder="Optional amount"
      />
    </div>
  );
}
