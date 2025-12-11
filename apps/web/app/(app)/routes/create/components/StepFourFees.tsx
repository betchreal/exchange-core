import { Input } from "@/components/ui/Input";
import type { FeesState } from "../page";

type StepFourFeesProps = {
  fees: FeesState;
  setFees: React.Dispatch<React.SetStateAction<FeesState>>;
};

export function StepFourFees({ fees, setFees }: StepFourFeesProps) {
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Commission</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Commission Amount"
            type="text"
            value={fees.commissionAmount}
            onChange={(e) =>
              setFees((prev) => ({
                ...prev,
                commissionAmount: e.target.value,
              }))
            }
            placeholder="0.5"
          />
          <Input
            label="Commission Percentage"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={fees.commissionPercentage}
            onChange={(e) =>
              setFees((prev) => ({
                ...prev,
                commissionPercentage: e.target.value,
              }))
            }
            placeholder="1.5"
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Set fixed amount and/or percentage commission for this route
        </p>
      </div>

      <div className="pt-2">
        <h3 className="text-sm font-medium text-slate-900 mb-3">Loss</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Loss Amount"
            type="text"
            value={fees.lossAmount}
            onChange={(e) =>
              setFees((prev) => ({
                ...prev,
                lossAmount: e.target.value,
              }))
            }
            placeholder="0.1"
          />
          <Input
            label="Loss Percentage"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={fees.lossPercentage}
            onChange={(e) =>
              setFees((prev) => ({
                ...prev,
                lossPercentage: e.target.value,
              }))
            }
            placeholder="0.5"
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Set fixed amount and/or percentage loss tolerance for this route
        </p>
      </div>
    </div>
  );
}
