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
import { useParams, useRouter } from "next/navigation";
import { StepOneBasic } from "../create/components/StepOneBasic";
import { StepTwoRate } from "../create/components/StepTwoRate";
import { StepThreeFields } from "../create/components/StepThreeFields";
import { StepFourFees } from "../create/components/StepFourFees";
import { StepFivePlugins } from "../create/components/StepFivePlugins";
import type {
  BasicsState,
  CurrencyOption,
  ParserOption,
  RateState,
  FieldsState,
  FeesState,
  PluginsState,
  PluginOption,
} from "../create/page";

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

export default function EditRoutePage() {
  const router = useRouter();
  const params = useParams();
  const routeId = params.id as string;

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
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const res = await api.get(`/route/${routeId}`);
        const route = res.data;

        setBasics({
          fromCurrencyId: String(route.fromCurrencyId),
          toCurrencyId: String(route.toCurrencyId),
          minFrom: route.minFrom,
          maxFrom: route.maxFrom,
          minTo: route.minTo,
          maxTo: route.maxTo,
        });

        setRate({
          parserId: route.parserId ? String(route.parserId) : "",
          fromCurrencyParser: route.fromCurrencyParser || "",
          toCurrencyParser: route.toCurrencyParser || "",
          orderLifetimeMin: String(route.orderLifetimeMin),
        });

        setFields({
          extra: (route.formFields?.extra || []).map((f: any) => ({
            label: f.label,
            hint: f.hint,
            validator: f.validator,
          })),
        });

        setFees({
          commissionAmount: route.commissionAmount || "",
          commissionPercentage: route.commissionPercentage || "",
          lossAmount: route.lossAmount || "",
          lossPercentage: route.lossPercentage || "",
        });

        setPlugins({
          merchantBinding: route.merchantBinding,
          payoutBinding: route.payoutBinding,
          depositAmlBinding: route.depositAmlBinding,
          withdrawAmlBinding: route.withdrawAmlBinding,
          merchantId: route.merchantId,
          manualMerchant: route.manualMerchant || {
            paymentSystem: "",
            paymentAccount: "",
            comment: "",
          },
          payoutId: route.payoutId,
          depositAmlId: route.depositAmlId,
          withdrawAmlId: route.withdrawAmlId,
        });

        setFetchLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load route");
        setFetchLoading(false);
      }
    };
    fetchRoute();
  }, [routeId]);

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
      } catch (err) {
        console.error("Failed to fetch currencies:", err);
      }
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    const fetchParsers = async () => {
      try {
        const res = await api.get("/parser/all");
        setParserOptions(res.data);
      } catch (err) {
        console.error("Failed to fetch parsers:", err);
      }
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
        minFrom: basics.minFrom.trim(),
        maxFrom: basics.maxFrom.trim(),
        minTo: basics.minTo.trim(),
        maxTo: basics.maxTo.trim(),
        parserId: rate.parserId ? Number(rate.parserId) : undefined,
        fromCurrencyParser: rate.fromCurrencyParser.trim() || undefined,
        toCurrencyParser: rate.toCurrencyParser.trim() || undefined,
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

      await api.patch(`/route/${routeId}`, payload);
      router.push("/routes");
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || "Failed to update route";
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
    if (!rate.orderLifetimeMin.trim()) return false;
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

  if (fetchLoading) {
    return (
      <div className="flex w-full flex-col gap-6">
        <CardHeader title="Edit route" description="Loading route data" />
      </div>
    );
  }

  if (error && !fetchLoading && basics.fromCurrencyId === "") {
    return (
      <div className="flex w-full flex-col gap-6">
        <CardHeader title="Edit route" description="Route not found" />
        <Card>
          <InlineError message={error} />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <CardHeader
        title="Edit route"
        description="Update route details, parser pairs, extra fields, fees, and plugin bindings."
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
            Update route
          </Button>
        )}
      </div>
    </div>
  );
}
