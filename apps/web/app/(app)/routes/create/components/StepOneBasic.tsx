import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import type { BasicsState, CurrencyOption } from "../page";

type StepOneBasicProps = {
  basics: BasicsState;
  setBasics: React.Dispatch<React.SetStateAction<BasicsState>>;
  currencyOptions: CurrencyOption[];
};

export function StepOneBasic({
  basics,
  setBasics,
  currencyOptions,
}: StepOneBasicProps) {
  const currencySelectOptions = [
    { value: "", label: "Select currency" },
    ...currencyOptions.map((c) => ({
      value: String(c.id),
      label: `${c.name} (${c.ticker})`,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      {basics.fromCurrencyId === basics.toCurrencyId &&
        basics.fromCurrencyId && (
          <p className="text-sm text-rose-600">
            From and To currencies must be different
          </p>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900">
              From Currency
            </h3>
            <Select
              label="Currency"
              value={basics.fromCurrencyId}
              onChange={(e) =>
                setBasics((prev) => ({
                  ...prev,
                  fromCurrencyId: e.target.value,
                }))
              }
              options={currencySelectOptions}
              required
            />
            <Input
              label="Min Amount"
              type="text"
              value={basics.minFrom}
              onChange={(e) =>
                setBasics((prev) => ({
                  ...prev,
                  minFrom: e.target.value,
                }))
              }
              required
            />
            <Input
              label="Max Amount"
              type="text"
              value={basics.maxFrom}
              onChange={(e) =>
                setBasics((prev) => ({
                  ...prev,
                  maxFrom: e.target.value,
                }))
              }
              required
            />
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-900">To Currency</h3>
            <Select
              label="Currency"
              value={basics.toCurrencyId}
              onChange={(e) =>
                setBasics((prev) => ({
                  ...prev,
                  toCurrencyId: e.target.value,
                }))
              }
              options={currencySelectOptions}
              required
            />
            <Input
              label="Min Amount"
              type="text"
              value={basics.minTo}
              onChange={(e) =>
                setBasics((prev) => ({
                  ...prev,
                  minTo: e.target.value,
                }))
              }
              required
            />
            <Input
              label="Max Amount"
              type="text"
              value={basics.maxTo}
              onChange={(e) =>
                setBasics((prev) => ({
                  ...prev,
                  maxTo: e.target.value,
                }))
              }
              required
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
