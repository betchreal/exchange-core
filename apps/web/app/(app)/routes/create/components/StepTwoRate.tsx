import { useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { RateState, ParserOption } from "../page";

type StepTwoRateProps = {
  rate: RateState;
  setRate: React.Dispatch<React.SetStateAction<RateState>>;
  parserOptions: ParserOption[];
  supportedPairs: Record<string, string[]>;
};

export function StepTwoRate({
  rate,
  setRate,
  parserOptions,
  supportedPairs,
}: StepTwoRateProps) {
  const parserSelectOptions = [
    { value: "", label: "Select parser" },
    ...parserOptions.map((p) => ({
      value: String(p.id),
      label: `${p.name} ${p.version}`,
    })),
  ];

  const fromCurrencyParserOptions = [
    { value: "", label: "Select from currency" },
    ...Object.keys(supportedPairs).map((key) => ({
      value: key,
      label: key,
    })),
  ];

  const toCurrencyParserOptions = [
    { value: "", label: "Select to currency" },
    ...(rate.fromCurrencyParser
      ? (supportedPairs[rate.fromCurrencyParser] || []).map((value) => ({
          value,
          label: value,
        }))
      : []),
  ];

  useEffect(() => {
    if (rate.fromCurrencyParser && supportedPairs[rate.fromCurrencyParser]) {
      const validToCurrencies = supportedPairs[rate.fromCurrencyParser];
      if (!validToCurrencies.includes(rate.toCurrencyParser)) {
        setRate((prev) => ({
          ...prev,
          toCurrencyParser: "",
        }));
      }
    }
  }, [rate.fromCurrencyParser, supportedPairs, rate.toCurrencyParser, setRate]);

  return (
    <div className="space-y-4">
      <Select
        label="Parser"
        value={rate.parserId}
        onChange={(e) =>
          setRate((prev) => ({
            ...prev,
            parserId: e.target.value,
            fromCurrencyParser: "",
            toCurrencyParser: "",
          }))
        }
        options={parserSelectOptions}
        required
      />

      {rate.parserId && fromCurrencyParserOptions.length === 1 && (
        <p className="text-sm text-amber-600">
          No supported pairs found for this parser
        </p>
      )}

      {rate.parserId && fromCurrencyParserOptions.length > 1 && (
        <div className="border-t border-slate-200 pt-4 mt-4">
          <h3 className="text-sm font-medium text-slate-900 mb-3">
            Exchange Rate Pair
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="From Currency (Parser)"
              value={rate.fromCurrencyParser}
              onChange={(e) =>
                setRate((prev) => ({
                  ...prev,
                  fromCurrencyParser: e.target.value,
                  toCurrencyParser: "",
                }))
              }
              options={fromCurrencyParserOptions}
              required
            />
            <Select
              label="To Currency (Parser)"
              value={rate.toCurrencyParser}
              onChange={(e) =>
                setRate((prev) => ({
                  ...prev,
                  toCurrencyParser: e.target.value,
                }))
              }
              options={toCurrencyParserOptions}
              disabled={!rate.fromCurrencyParser}
              required
            />
          </div>
          {rate.fromCurrencyParser && toCurrencyParserOptions.length === 1 && (
            <p className="text-sm text-amber-600 mt-2">
              No target currencies available for {rate.fromCurrencyParser}
            </p>
          )}
        </div>
      )}

      <div className="border-t border-slate-200 pt-4 mt-4">
        <Input
          label="Order Lifetime (minutes)"
          type="number"
          min={1}
          max={600}
          value={rate.orderLifetimeMin}
          onChange={(e) =>
            setRate((prev) => ({
              ...prev,
              orderLifetimeMin: e.target.value,
            }))
          }
          required
        />
      </div>
    </div>
  );
}
