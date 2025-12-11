import Link from "next/link";
import { PluginStatus, PluginType } from "@exchange-core/common";

type PluginCardProps = {
  id: number;
  name: string;
  version: string;
  status: PluginStatus;
  type: PluginType;
};

const statusStyles: Record<
  PluginStatus,
  { bg: string; text: string; label: string }
> = {
  [PluginStatus.INSTALLED]: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "Installed",
  },
  [PluginStatus.ACTIVE]: {
    bg: "bg-green-100",
    text: "text-green-700",
    label: "Active",
  },
  [PluginStatus.DISABLED]: {
    bg: "bg-red-100",
    text: "text-red-700",
    label: "Disabled",
  },
};

const typeRoutes: Record<PluginCardProps["type"], string> = {
  payout: "/plugins/payouts",
  merchant: "/plugins/merchants",
  parser: "/plugins/parsers",
  aml: "/plugins/amls",
};

export function PluginCard({
  id,
  name,
  version,
  status,
  type,
}: PluginCardProps) {
  const statusStyle = statusStyles[status];
  const baseRoute = typeRoutes[type];

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 p-4 md:p-5">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-slate-900">{name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{version}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
        >
          {statusStyle.label}
        </span>
      </div>

      <div className="border-t border-slate-200" />

      <div className="bg-slate-50 px-4 py-3 md:px-5">
        <Link
          href={`${baseRoute}/${id}`}
          className="flex items-center justify-between text-sm text-slate-600 hover:text-slate-900"
        >
          <span>Settings</span>
          <span className="text-lg text-slate-400">→</span>
        </Link>
      </div>
    </div>
  );
}
