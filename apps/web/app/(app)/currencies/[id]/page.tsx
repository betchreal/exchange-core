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
} from "@exchange-core/common";
import { useParams, useRouter } from "next/navigation";
import { StepOneGeneral } from "../create/components/StepOneGeneral";
import { StepTwoFields } from "../create/components/StepTwoFields";
import { StepThreePlugins } from "../create/components/StepThreePlugins";
import type {
  BasicsState,
  CodeOption,
  FieldsState,
  PluginOption,
  PluginsState,
} from "../create/page";

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

export default function EditCurrencyPage() {
  const router = useRouter();
  const params = useParams();
  const currencyId = params.id as string;

  const [currentStep, setCurrentStep] = useState(0);
  const [basics, setBasics] = useState<BasicsState>(initialBasics);
  const [fields, setFields] = useState<FieldsState>(initialFields);
  const [plugins, setPlugins] = useState<PluginsState>(initialPlugins);
  const [merchantOptions, setMerchantOptions] = useState<PluginOption[]>([]);
  const [payoutOptions, setPayoutOptions] = useState<PluginOption[]>([]);
  const [amlOptions, setAmlOptions] = useState<PluginOption[]>([]);
  const [codeOptions, setCodeOptions] = useState<CodeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const codeReady = basics.code.trim().toUpperCase();

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const res = await api.get(`/currency/${currencyId}`);
        const currency = res.data;

        setBasics({
          name: currency.name,
          ticker: currency.ticker,
          precision: currency.precision,
          code: currency.code,
          reserve: currency.reserve,
          merchantBinding: currency.merchantBinding,
        });

        setFields({
          deposit: currency.depositFields.map((f: any) => ({
            label: f.label,
            hint: f.hint,
            validator: f.validator,
          })),
          withdraw: currency.withdrawFields.map((f: any) => ({
            label: f.label,
            hint: f.hint,
            validator: f.validator,
          })),
        });

        setPlugins({
          payoutBinding: currency.payoutId
            ? PayoutBinding.EXPLICIT
            : PayoutBinding.NONE,
          amlBinding: currency.aml ? AmlBinding.EXPLICIT : AmlBinding.NONE,
          merchantId: currency.merchantId,
          manualMerchant: currency.manualMerchant || {
            paymentSystem: "",
            paymentAccount: "",
            comment: "",
          },
          payoutId: currency.payoutId,
          amlId: currency.amlId,
        });

        setFetchLoading(false);
      } catch (err: any) {
        if ((err as DOMException).name === "AbortError") return;
        setError(err.response?.data?.message || "Failed to load currency");
        setFetchLoading(false);
      }
    };
    fetchCurrency();
  }, [currencyId]);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const res = await api.get("/currency/codes");
        setCodeOptions(res.data);
      } catch {}
    };
    fetchCodes();
  }, []);

  useEffect(() => {
    if (!codeReady) {
      setMerchantOptions([]);
      setPayoutOptions([]);
      return;
    }

    const fetchPlugins = async () => {
      try {
        const [merchantsRes, payoutsRes] = await Promise.all([
          api.get("/merchant/all", {
            params: { code: codeReady },
          }),
          api.get("/payout/all", {
            params: { code: codeReady },
          }),
        ]);
        setMerchantOptions(merchantsRes.data);
        setPayoutOptions(payoutsRes.data);
      } catch {}
    };

    fetchPlugins();
  }, [codeReady]);

  useEffect(() => {
    const fetchAml = async () => {
      try {
        const res = await api.get("/aml/all");
        setAmlOptions(res.data);
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return;
      }
    };
    fetchAml();
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
          plugins.payoutBinding === "explicit" ? plugins.payoutId : undefined,
        amlId: plugins.amlBinding === "explicit" ? plugins.amlId : undefined,
      };

      await api.patch(`/currency/${currencyId}`, payload);
      router.push("/currencies");
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Failed to update currency";
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
    if (plugins.payoutBinding === "explicit" && !plugins.payoutId) return false;
    if (plugins.amlBinding === "explicit" && !plugins.amlId) return false;
    return true;
  }, [basics, plugins, codeReady]);

  if (fetchLoading) {
    return (
      <div className="flex w-full flex-col gap-6">
        <CardHeader
          title="Edit currency"
          description="Loading currency data..."
        />
      </div>
    );
  }

  if (error && !fetchLoading && basics.name === "") {
    return (
      <div className="flex w-full flex-col gap-6">
        <CardHeader title="Edit currency" description="Currency not found" />
        <Card>
          <InlineError message={error} />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <CardHeader
        title="Edit currency"
        description="Update currency details, form fields, and plugin bindings."
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
            Update currency
          </Button>
        )}
      </div>
    </div>
  );
}
