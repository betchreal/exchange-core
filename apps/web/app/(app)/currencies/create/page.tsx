"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { Button } from "@/components/ui/Button";
import { InlineError } from "@/components/ui/InlineError";
import { api } from "@/lib/axios";
import {
  AmlBinding,
  CurrencyMerchantBinding,
  FieldType,
  PayoutBinding,
  PluginStatus,
} from "@exchange-core/common";
import { useRouter } from "next/navigation";
import { StepOneGeneral } from "./components/StepOneGeneral";
import { StepTwoFields } from "./components/StepTwoFields";
import { StepThreePlugins } from "./components/StepThreePlugins";
import type { EditableField } from "../../../../components/FieldListEditor";

export type PluginOption = {
  id: number;
  name: string;
  status: PluginStatus;
  version: string;
};

export type CodeOption = {
  code: string;
  description: string;
};

export type ManualMerchantForm = {
  paymentSystem: string;
  paymentAccount: string;
  comment?: string;
};

export type BasicsState = {
  name: string;
  ticker: string;
  precision: string;
  code: string;
  reserve: string;
  merchantBinding: CurrencyMerchantBinding;
};

export type FieldsState = {
  deposit: EditableField[];
  withdraw: EditableField[];
};

export type PluginsState = {
  payoutBinding: PayoutBinding;
  amlBinding: AmlBinding;
  merchantId?: number;
  manualMerchant: ManualMerchantForm;
  payoutId?: number;
  amlId?: number;
};

const initialBasics: BasicsState = {
  name: "",
  ticker: "",
  precision: "0",
  code: "",
  reserve: "",
  merchantBinding: CurrencyMerchantBinding.EXPLICIT,
};

const initialFields: FieldsState = {
  deposit: [],
  withdraw: [],
};

const initialPlugins: PluginsState = {
  payoutBinding: PayoutBinding.NONE,
  amlBinding: AmlBinding.NONE,
  manualMerchant: {
    paymentSystem: "",
    paymentAccount: "",
    comment: "",
  },
};

const steps = ["General", "Form Fields", "Plugins & Integrations"];

export default function CreateCurrencyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [basics, setBasics] = useState<BasicsState>(initialBasics);
  const [fields, setFields] = useState<FieldsState>(initialFields);
  const [plugins, setPlugins] = useState<PluginsState>(initialPlugins);
  const [merchantOptions, setMerchantOptions] = useState<PluginOption[]>([]);
  const [payoutOptions, setPayoutOptions] = useState<PluginOption[]>([]);
  const [amlOptions, setAmlOptions] = useState<PluginOption[]>([]);
  const [codeOptions, setCodeOptions] = useState<
    Array<{ code: string; description: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const codeReady = basics.code.trim().toUpperCase();

  useEffect(() => {
    const controller = new AbortController();
    const fetchCodes = async () => {
      try {
        const res = await api.get("/currency/codes", {
          signal: controller.signal,
        });
        setCodeOptions(res.data);
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return;
      }
    };
    fetchCodes();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!codeReady) {
      setMerchantOptions([]);
      setPayoutOptions([]);
      return;
    }
    const controller = new AbortController();

    const fetchPlugins = async () => {
      try {
        const [merchantsRes, payoutsRes] = await Promise.all([
          api.get("/merchant/all", {
            params: { code: codeReady },
            signal: controller.signal,
          }),
          api.get("/payout/all", {
            params: { code: codeReady },
            signal: controller.signal,
          }),
        ]);
        setMerchantOptions(merchantsRes.data);
        setPayoutOptions(payoutsRes.data);
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return;
      }
    };

    fetchPlugins();
    return () => controller.abort();
  }, [codeReady]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchAml = async () => {
      try {
        const res = await api.get("/aml/all", {
          signal: controller.signal,
        });
        setAmlOptions(res.data);
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return;
      }
    };
    fetchAml();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (
      plugins.payoutBinding !== PayoutBinding.EXPLICIT &&
      plugins.payoutId != null
    ) {
      setPlugins((prev) => ({ ...prev, payoutId: undefined }));
    }
  }, [plugins.payoutBinding, plugins.payoutId]);

  useEffect(() => {
    if (plugins.amlBinding !== AmlBinding.EXPLICIT && plugins.amlId != null) {
      setPlugins((prev) => ({ ...prev, amlId: undefined }));
    }
  }, [plugins.amlBinding, plugins.amlId]);

  const nextStep = () =>
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: basics.name.trim(),
        ticker: basics.ticker.trim(),
        precision: Number(basics.precision),
        code: codeReady,
        reserve: basics.reserve.trim() || undefined,
        depositFields: fields.deposit.map((field) => ({
          ...field,
          type: FieldType.DEPOSIT,
        })),
        withdrawFields: fields.withdraw.map((field) => ({
          ...field,
          type: FieldType.WITHDRAW,
        })),
        merchantBinding: basics.merchantBinding,
        merchantId:
          basics.merchantBinding === CurrencyMerchantBinding.EXPLICIT
            ? plugins.merchantId
            : undefined,
        manualMerchant:
          basics.merchantBinding === CurrencyMerchantBinding.MANUAL
            ? plugins.manualMerchant
            : undefined,
        payoutId:
          plugins.payoutBinding === PayoutBinding.EXPLICIT
            ? plugins.payoutId
            : undefined,
        amlId:
          plugins.amlBinding === AmlBinding.EXPLICIT
            ? plugins.amlId
            : undefined,
      };

      await api.post("/currency", payload);
      router.push("/currencies");
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to create currency";
      setError(Array.isArray(message) ? message.join("\n") : message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = useMemo(() => {
    if (!basics.name.trim() || !basics.ticker.trim() || !codeReady)
      return false;
    if (
      basics.merchantBinding === CurrencyMerchantBinding.EXPLICIT &&
      !plugins.merchantId
    )
      return false;
    if (
      basics.merchantBinding === CurrencyMerchantBinding.MANUAL &&
      (!plugins.manualMerchant.paymentSystem.trim() ||
        !plugins.manualMerchant.paymentAccount.trim())
    )
      return false;
    if (plugins.payoutBinding === PayoutBinding.EXPLICIT && !plugins.payoutId)
      return false;
    if (plugins.amlBinding === AmlBinding.EXPLICIT && !plugins.amlId)
      return false;
    return true;
  }, [basics, plugins, codeReady]);

  return (
    <div className="flex w-full flex-col gap-6">
      <CardHeader
        title="Create currency"
        description="Set up currency details to create"
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

      <Card>
        {currentStep === 0 && (
          <StepOneGeneral
            basics={basics}
            setBasics={setBasics}
            codeOptions={codeOptions}
          />
        )}
        {currentStep === 1 && (
          <StepTwoFields fields={fields} setFields={setFields} />
        )}
        {currentStep === 2 && (
          <StepThreePlugins
            basics={basics}
            setBasics={setBasics}
            plugins={plugins}
            setPlugins={setPlugins}
            merchantOptions={merchantOptions}
            payoutOptions={payoutOptions}
            amlOptions={amlOptions}
            codeReady={codeReady}
          />
        )}
      </Card>

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
            Create currency
          </Button>
        )}
      </div>
    </div>
  );
}
