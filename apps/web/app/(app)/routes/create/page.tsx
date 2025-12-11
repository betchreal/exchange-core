"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { Button } from "@/components/ui/Button";
import { InlineError } from "@/components/ui/InlineError";
import { api } from "@/lib/axios";
import {
  AmlBinding,
  PayoutBinding,
  RouteMerchantBinding,
  PluginStatus,
} from "@exchange-core/common";
import { useRouter } from "next/navigation";
import type { EditableField } from "@/components/FieldListEditor";
import type { ManualMerchantForm } from "../../currencies/create/page";
import { StepOneBasic } from "./components/StepOneBasic";
import { StepTwoRate } from "./components/StepTwoRate";
import { StepThreeFields } from "./components/StepThreeFields";
import { StepFourFees } from "./components/StepFourFees";
import { StepFivePlugins } from "./components/StepFivePlugins";

export type CurrencyOption = {
  id: number;
  name: string;
  ticker: string;
  code: string;
};

export type ParserOption = {
  id: number;
  name: string;
  status: PluginStatus;
  version: string;
};

export type PluginOption = {
  id: number;
  name: string;
  status: PluginStatus;
  version: string;
};

export type BasicsState = {
  fromCurrencyId: string;
  toCurrencyId: string;
  minFrom: string;
  maxFrom: string;
  minTo: string;
  maxTo: string;
};

export type RateState = {
  parserId: string;
  fromCurrencyParser: string;
  toCurrencyParser: string;
  orderLifetimeMin: string;
};

export type FieldsState = {
  extra: EditableField[];
};

export type FeesState = {
  commissionAmount: string;
  commissionPercentage: string;
  lossAmount: string;
  lossPercentage: string;
};

export type PluginsState = {
  merchantBinding: RouteMerchantBinding;
  payoutBinding: PayoutBinding;
  depositAmlBinding: AmlBinding;
  withdrawAmlBinding: AmlBinding;
  merchantId?: number;
  manualMerchant: ManualMerchantForm;
  payoutId?: number;
  depositAmlId?: number;
  withdrawAmlId?: number;
};

const initialBasics: BasicsState = {
  fromCurrencyId: "",
  toCurrencyId: "",
  minFrom: "",
  maxFrom: "",
  minTo: "",
  maxTo: "",
};

const initialRate: RateState = {
  parserId: "",
  fromCurrencyParser: "",
  toCurrencyParser: "",
  orderLifetimeMin: "30",
};

const initialFields: FieldsState = {
  extra: [],
};

const initialFees: FeesState = {
  commissionAmount: "",
  commissionPercentage: "",
  lossAmount: "",
  lossPercentage: "",
};

const initialPlugins: PluginsState = {
  merchantBinding: RouteMerchantBinding.DEFAULT,
  payoutBinding: PayoutBinding.DEFAULT,
  depositAmlBinding: AmlBinding.NONE,
  withdrawAmlBinding: AmlBinding.NONE,
  manualMerchant: {
    paymentSystem: "",
    paymentAccount: "",
    comment: "",
  },
};

const steps = [
  "Basic",
  "Rate & Order Details",
  "Extra Fields",
  "Fees",
  "Plugins",
];

export default function CreateRoutePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [basics, setBasics] = useState<BasicsState>(initialBasics);
  const [rate, setRate] = useState<RateState>(initialRate);
  const [fields, setFields] = useState<FieldsState>(initialFields);
  const [fees, setFees] = useState<FeesState>(initialFees);
  const [plugins, setPlugins] = useState<PluginsState>(initialPlugins);
  const [currencyOptions, setCurrencyOptions] = useState<CurrencyOption[]>([]);
  const [parserOptions, setParserOptions] = useState<ParserOption[]>([]);
  const [merchantOptions, setMerchantOptions] = useState<PluginOption[]>([]);
  const [payoutOptions, setPayoutOptions] = useState<PluginOption[]>([]);
  const [amlOptions, setAmlOptions] = useState<PluginOption[]>([]);
  const [supportedPairs, setSupportedPairs] = useState<
    Record<string, string[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await api.get("/currency/all", {
          params: { limit: 1000 },
        });
        setCurrencyOptions(
          res.data.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            ticker: c.ticker,
            code: c.code,
          })),
        );
      } catch {}
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    const fetchParsers = async () => {
      try {
        const res = await api.get("/parser/all");
        setParserOptions(res.data);
      } catch {}
    };
    fetchParsers();
  }, []);

  useEffect(() => {
    if (!rate.parserId) {
      setSupportedPairs({});
      return;
    }

    const fetchParserDetails = async () => {
      try {
        const res = await api.get(`/parser/${rate.parserId}`);
        setSupportedPairs(res.data.supportedPairs || {});
      } catch {
        setSupportedPairs({});
      }
    };

    fetchParserDetails();
  }, [rate.parserId]);

  useEffect(() => {
    const fromCurrency = currencyOptions.find(
      (c) => c.id === Number(basics.fromCurrencyId),
    );
    if (!fromCurrency) {
      setMerchantOptions([]);
      return;
    }

    const fetchMerchants = async () => {
      try {
        const res = await api.get("/merchant/all", {
          params: { code: fromCurrency.code },
        });
        setMerchantOptions(res.data);
      } catch {}
    };

    fetchMerchants();
  }, [basics.fromCurrencyId, currencyOptions]);

  useEffect(() => {
    const toCurrency = currencyOptions.find(
      (c) => c.id === Number(basics.toCurrencyId),
    );
    if (!toCurrency) {
      setPayoutOptions([]);
      return;
    }

    const fetchPayouts = async () => {
      try {
        const res = await api.get("/payout/all", {
          params: { code: toCurrency.code },
        });
        setPayoutOptions(res.data);
      } catch {}
    };

    fetchPayouts();
  }, [basics.toCurrencyId, currencyOptions]);

  useEffect(() => {
    const fetchAml = async () => {
      try {
        const res = await api.get("/aml/all");
        setAmlOptions(res.data);
      } catch (err) {
        console.error("Failed to fetch AML plugins:", err);
      }
    };
    fetchAml();
  }, []);

  useEffect(() => {
    if (
      plugins.merchantBinding !== RouteMerchantBinding.EXPLICIT &&
      plugins.merchantId != null
    ) {
      setPlugins((prev) => ({ ...prev, merchantId: undefined }));
    }
  }, [plugins.merchantBinding, plugins.merchantId]);

  useEffect(() => {
    if (
      plugins.payoutBinding !== PayoutBinding.EXPLICIT &&
      plugins.payoutId != null
    ) {
      setPlugins((prev) => ({ ...prev, payoutId: undefined }));
    }
  }, [plugins.payoutBinding, plugins.payoutId]);

  useEffect(() => {
    if (
      plugins.depositAmlBinding !== AmlBinding.EXPLICIT &&
      plugins.depositAmlId != null
    ) {
      setPlugins((prev) => ({ ...prev, depositAmlId: undefined }));
    }
  }, [plugins.depositAmlBinding, plugins.depositAmlId]);

  useEffect(() => {
    if (
      plugins.withdrawAmlBinding !== AmlBinding.EXPLICIT &&
      plugins.withdrawAmlId != null
    ) {
      setPlugins((prev) => ({ ...prev, withdrawAmlId: undefined }));
    }
  }, [plugins.withdrawAmlBinding, plugins.withdrawAmlId]);

  const nextStep = () =>
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        fromCurrencyId: Number(basics.fromCurrencyId),
        toCurrencyId: Number(basics.toCurrencyId),
        minFrom: basics.minFrom.trim(),
        maxFrom: basics.maxFrom.trim(),
        minTo: basics.minTo.trim(),
        maxTo: basics.maxTo.trim(),
        parserId: Number(rate.parserId),
        fromCurrencyParser: rate.fromCurrencyParser.trim(),
        toCurrencyParser: rate.toCurrencyParser.trim(),
        orderLifetimeMin: Number(rate.orderLifetimeMin),
        extraFields: fields.extra,
        commissionAmount: fees.commissionAmount.trim() || undefined,
        commissionPercentage: fees.commissionPercentage.trim()
          ? Number(fees.commissionPercentage)
          : undefined,
        lossAmount: fees.lossAmount.trim() || undefined,
        lossPercentage: fees.lossPercentage.trim()
          ? Number(fees.lossPercentage)
          : undefined,
        merchantBinding: plugins.merchantBinding,
        payoutBinding: plugins.payoutBinding,
        depositAmlBinding: plugins.depositAmlBinding,
        withdrawAmlBinding: plugins.withdrawAmlBinding,
        merchantId:
          plugins.merchantBinding === RouteMerchantBinding.EXPLICIT
            ? plugins.merchantId
            : undefined,
        manualMerchant:
          plugins.merchantBinding === RouteMerchantBinding.MANUAL
            ? plugins.manualMerchant
            : undefined,
        payoutId:
          plugins.payoutBinding === PayoutBinding.EXPLICIT
            ? plugins.payoutId
            : undefined,
        depositAmlId:
          plugins.depositAmlBinding === AmlBinding.EXPLICIT
            ? plugins.depositAmlId
            : undefined,
        withdrawAmlId:
          plugins.withdrawAmlBinding === AmlBinding.EXPLICIT
            ? plugins.withdrawAmlId
            : undefined,
      };

      await api.post("/route", payload);
      router.push("/routes");
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || "Failed to create route";
      setError(Array.isArray(message) ? message.join("\n") : message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = useMemo(() => {
    if (
      !basics.fromCurrencyId ||
      !basics.toCurrencyId ||
      !basics.minFrom.trim() ||
      !basics.maxFrom.trim() ||
      !basics.minTo.trim() ||
      !basics.maxTo.trim()
    )
      return false;
    if (basics.fromCurrencyId === basics.toCurrencyId) return false;
    if (
      !rate.parserId ||
      !rate.fromCurrencyParser.trim() ||
      !rate.toCurrencyParser.trim() ||
      !rate.orderLifetimeMin.trim()
    )
      return false;
    if (
      plugins.merchantBinding === RouteMerchantBinding.EXPLICIT &&
      !plugins.merchantId
    )
      return false;
    if (
      plugins.merchantBinding === RouteMerchantBinding.MANUAL &&
      (!plugins.manualMerchant.paymentSystem.trim() ||
        !plugins.manualMerchant.paymentAccount.trim())
    )
      return false;
    if (plugins.payoutBinding === PayoutBinding.EXPLICIT && !plugins.payoutId)
      return false;
    if (
      plugins.depositAmlBinding === AmlBinding.EXPLICIT &&
      !plugins.depositAmlId
    )
      return false;
    if (
      plugins.withdrawAmlBinding === AmlBinding.EXPLICIT &&
      !plugins.withdrawAmlId
    )
      return false;
    return true;
  }, [basics, rate, plugins]);

  return (
    <div className="flex w-full flex-col gap-6">
      <CardHeader
        title="Create route"
        description="Set up route details to create"
      />

      <Card>
        <div className="flex flex-col items-center gap-3 text-sm font-medium text-slate-600 md:flex-row md:justify-center">
          {steps.map((label, idx) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={[
                  "h-9 w-9 rounded-full border flex items-center justify-center text-sm",
                  idx === currentStep
                    ? "border-slate-900 text-slate-900"
                    : idx < currentStep
                      ? "border-emerald-600 text-emerald-600"
                      : "border-slate-300 text-slate-300",
                ].join(" ")}
              >
                {idx + 1}
              </div>
              <span
                className={
                  idx === currentStep
                    ? "text-slate-900"
                    : idx < currentStep
                      ? "text-emerald-600"
                      : "text-slate-400"
                }
              >
                {label}
              </span>
              {idx < steps.length - 1 && (
                <div className="h-px w-10 bg-slate-200" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {error && (
        <Card>
          <InlineError message={error} />
        </Card>
      )}

      {currentStep === 0 ? (
        <StepOneBasic
          basics={basics}
          setBasics={setBasics}
          currencyOptions={currencyOptions}
        />
      ) : (
        <Card>
          {currentStep === 1 && (
            <StepTwoRate
              rate={rate}
              setRate={setRate}
              parserOptions={parserOptions}
              supportedPairs={supportedPairs}
            />
          )}
          {currentStep === 2 && (
            <StepThreeFields fields={fields} setFields={setFields} />
          )}
          {currentStep === 3 && <StepFourFees fees={fees} setFees={setFees} />}
          {currentStep === 4 && (
            <StepFivePlugins
              plugins={plugins}
              setPlugins={setPlugins}
              merchantOptions={merchantOptions}
              payoutOptions={payoutOptions}
              amlOptions={amlOptions}
            />
          )}
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          Back
        </Button>
        {currentStep < steps.length - 1 ? (
          <Button type="button" onClick={nextStep}>
            Next
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            loading={loading}
          >
            Create route
          </Button>
        )}
      </div>
    </div>
  );
}
