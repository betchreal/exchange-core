"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { BindingToggle } from "../../../../../components/BindingToggle";
import {
  CurrencyMerchantBinding,
  PayoutBinding,
  AmlBinding,
} from "@exchange-core/common";
import type { BasicsState, PluginsState, PluginOption } from "../page";

type Step3PluginsProps = {
  basics: BasicsState;
  setBasics: React.Dispatch<React.SetStateAction<BasicsState>>;
  plugins: PluginsState;
  setPlugins: React.Dispatch<React.SetStateAction<PluginsState>>;
  merchantOptions: PluginOption[];
  payoutOptions: PluginOption[];
  amlOptions: PluginOption[];
  codeReady: string;
};

export function StepThreePlugins({
  basics,
  setBasics,
  plugins,
  setPlugins,
  merchantOptions,
  payoutOptions,
  amlOptions,
  codeReady,
}: Step3PluginsProps) {
  return (
    <div className="space-y-6">
      <BindingToggle
        label="Merchant binding"
        options={[
          { label: "Explicit", value: CurrencyMerchantBinding.EXPLICIT },
          { label: "Manual", value: CurrencyMerchantBinding.MANUAL },
        ]}
        value={basics.merchantBinding}
        onChange={(value) =>
          setBasics((prev) => ({
            ...prev,
            merchantBinding: value as CurrencyMerchantBinding,
          }))
        }
      />

      {basics.merchantBinding === CurrencyMerchantBinding.EXPLICIT && (
        <Select
          label="Merchant plugin"
          value={plugins.merchantId?.toString() ?? ""}
          onChange={(e) =>
            setPlugins((prev) => ({
              ...prev,
              merchantId: e.target.value ? Number(e.target.value) : undefined,
            }))
          }
          options={[
            { label: "Select merchant plugin", value: "" },
            ...merchantOptions.map((option) => ({
              label: `${option.name} ${option.version}`,
              value: option.id.toString(),
            })),
          ]}
          helperText={
            codeReady
              ? merchantOptions.length
                ? undefined
                : "No merchant plugins support this code."
              : "Set currency code first."
          }
        />
      )}

      {basics.merchantBinding === CurrencyMerchantBinding.MANUAL && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Payment system"
            value={plugins.manualMerchant.paymentSystem}
            onChange={(e) =>
              setPlugins((prev) => ({
                ...prev,
                manualMerchant: {
                  ...prev.manualMerchant,
                  paymentSystem: e.target.value,
                },
              }))
            }
          />
          <Input
            label="Payment account"
            value={plugins.manualMerchant.paymentAccount}
            onChange={(e) =>
              setPlugins((prev) => ({
                ...prev,
                manualMerchant: {
                  ...prev.manualMerchant,
                  paymentAccount: e.target.value,
                },
              }))
            }
          />
          <div className="md:col-span-2">
            <Input
              label="Comment"
              value={plugins.manualMerchant.comment ?? ""}
              onChange={(e) =>
                setPlugins((prev) => ({
                  ...prev,
                  manualMerchant: {
                    ...prev.manualMerchant,
                    comment: e.target.value,
                  },
                }))
              }
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <BindingToggle
          label="Payout binding"
          options={[
            { label: "None", value: "none" },
            { label: "Explicit", value: "explicit" },
          ]}
          value={plugins.payoutBinding}
          onChange={(value) =>
            setPlugins((prev) => ({
              ...prev,
              payoutBinding: value as PayoutBinding,
            }))
          }
        />
        {plugins.payoutBinding === "explicit" && (
          <Select
            label="Payout plugin"
            value={plugins.payoutId?.toString() ?? ""}
            onChange={(e) =>
              setPlugins((prev) => ({
                ...prev,
                payoutId: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            options={[
              { label: "Select payout plugin", value: "" },
              ...payoutOptions.map((option) => ({
                label: `${option.name} ${option.version}`,
                value: option.id.toString(),
              })),
            ]}
            helperText={
              codeReady
                ? payoutOptions.length
                  ? undefined
                  : "No payout plugins support this code."
                : "Set currency code first."
            }
          />
        )}
      </div>

      <div className="space-y-2">
        <BindingToggle
          label="AML binding"
          options={[
            { label: "None", value: "none" },
            { label: "Explicit", value: "explicit" },
          ]}
          value={plugins.amlBinding}
          onChange={(value) =>
            setPlugins((prev) => ({
              ...prev,
              amlBinding: value as AmlBinding,
            }))
          }
        />
        {plugins.amlBinding === "explicit" && (
          <Select
            label="AML plugin"
            value={plugins.amlId?.toString() ?? ""}
            onChange={(e) =>
              setPlugins((prev) => ({
                ...prev,
                amlId: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            options={[
              { label: "Select AML plugin", value: "" },
              ...amlOptions.map((option) => ({
                label: `${option.name} ${option.version}`,
                value: option.id.toString(),
              })),
            ]}
          />
        )}
      </div>
    </div>
  );
}
