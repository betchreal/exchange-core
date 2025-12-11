import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { BindingToggle } from "@/components/BindingToggle";
import {
  AmlBinding,
  PayoutBinding,
  RouteMerchantBinding,
} from "@exchange-core/common";
import type { PluginsState, PluginOption } from "../page";

type StepFivePluginsProps = {
  plugins: PluginsState;
  setPlugins: React.Dispatch<React.SetStateAction<PluginsState>>;
  merchantOptions: PluginOption[];
  payoutOptions: PluginOption[];
  amlOptions: PluginOption[];
};

export function StepFivePlugins({
  plugins,
  setPlugins,
  merchantOptions,
  payoutOptions,
  amlOptions,
}: StepFivePluginsProps) {
  const merchantSelectOptions = [
    { value: "", label: "Select merchant" },
    ...merchantOptions.map((p) => ({
      value: String(p.id),
      label: `${p.name} ${p.version}`,
    })),
  ];

  const payoutSelectOptions = [
    { value: "", label: "Select payout" },
    ...payoutOptions.map((p) => ({
      value: String(p.id),
      label: `${p.name} ${p.version}`,
    })),
  ];

  const amlSelectOptions = [
    { value: "", label: "Select AML" },
    ...amlOptions.map((p) => ({
      value: String(p.id),
      label: `${p.name} ${p.version}`,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <BindingToggle
          label="Merchant Plugin"
          options={[
            { label: "Default", value: RouteMerchantBinding.DEFAULT },
            { label: "Explicit", value: RouteMerchantBinding.EXPLICIT },
            { label: "Manual", value: RouteMerchantBinding.MANUAL },
          ]}
          value={plugins.merchantBinding}
          onChange={(value) =>
            setPlugins((prev) => ({
              ...prev,
              merchantBinding: value as RouteMerchantBinding,
            }))
          }
        />

        {plugins.merchantBinding === RouteMerchantBinding.EXPLICIT && (
          <div className="mt-3">
            <Select
              label="Select Merchant Plugin"
              value={plugins.merchantId ? String(plugins.merchantId) : ""}
              onChange={(e) =>
                setPlugins((prev) => ({
                  ...prev,
                  merchantId: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              options={merchantSelectOptions}
              required
            />
          </div>
        )}

        {plugins.merchantBinding === RouteMerchantBinding.MANUAL && (
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <Input
              label="Comment"
              value={plugins.manualMerchant.comment || ""}
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
        )}
      </div>

      <div className="border-b border-slate-200 pb-4">
        <BindingToggle
          label="Payout Plugin"
          options={[
            { label: "Default", value: PayoutBinding.DEFAULT },
            { label: "Explicit", value: PayoutBinding.EXPLICIT },
            { label: "None", value: PayoutBinding.NONE },
          ]}
          value={plugins.payoutBinding}
          onChange={(value) =>
            setPlugins((prev) => ({
              ...prev,
              payoutBinding: value as PayoutBinding,
            }))
          }
        />

        {plugins.payoutBinding === PayoutBinding.EXPLICIT && (
          <div className="mt-3">
            <Select
              label="Select Payout Plugin"
              value={plugins.payoutId ? String(plugins.payoutId) : ""}
              onChange={(e) =>
                setPlugins((prev) => ({
                  ...prev,
                  payoutId: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              options={payoutSelectOptions}
              required
            />
          </div>
        )}
      </div>

      <div className="border-b border-slate-200 pb-4">
        <BindingToggle
          label="Deposit AML Plugin"
          options={[
            { label: "Default", value: AmlBinding.DEFAULT },
            { label: "Explicit", value: AmlBinding.EXPLICIT },
            { label: "None", value: AmlBinding.NONE },
          ]}
          value={plugins.depositAmlBinding}
          onChange={(value) =>
            setPlugins((prev) => ({
              ...prev,
              depositAmlBinding: value as AmlBinding,
            }))
          }
        />

        {plugins.depositAmlBinding === AmlBinding.EXPLICIT && (
          <div className="mt-3">
            <Select
              label="Select Deposit AML Plugin"
              value={plugins.depositAmlId ? String(plugins.depositAmlId) : ""}
              onChange={(e) =>
                setPlugins((prev) => ({
                  ...prev,
                  depositAmlId: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              options={amlSelectOptions}
              required
            />
          </div>
        )}
      </div>

      <div>
        <BindingToggle
          label="Withdraw AML Plugin"
          options={[
            { label: "Default", value: AmlBinding.DEFAULT },
            { label: "Explicit", value: AmlBinding.EXPLICIT },
            { label: "None", value: AmlBinding.NONE },
          ]}
          value={plugins.withdrawAmlBinding}
          onChange={(value) =>
            setPlugins((prev) => ({
              ...prev,
              withdrawAmlBinding: value as AmlBinding,
            }))
          }
        />

        {plugins.withdrawAmlBinding === AmlBinding.EXPLICIT && (
          <div className="mt-3">
            <Select
              label="Select Withdraw AML Plugin"
              value={plugins.withdrawAmlId ? String(plugins.withdrawAmlId) : ""}
              onChange={(e) =>
                setPlugins((prev) => ({
                  ...prev,
                  withdrawAmlId: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              options={amlSelectOptions}
              required
            />
          </div>
        )}
      </div>
    </div>
  );
}
