"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/axios";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import { OrderStatus } from "@exchange-core/common";

type Order = {
  id: number;
  amountFrom: string;
  amountTo: string;
  status: OrderStatus;
  fromCurrency: {
    name: string;
    ticker: string;
  };
  toCurrency: {
    name: string;
    ticker: string;
  };
  rateFromTo: string | null;
  staff: {
    id: number;
    email: string;
  } | null;
  createdAt: string;
};

type OrdersResponse = {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type TabKey = "all" | "error" | `${OrderStatus[keyof typeof OrderStatus]}`;

const tabs: { key: TabKey; label: string; statuses?: OrderStatus[] }[] = [
  { key: "all", label: "All" },
  {
    key: OrderStatus.NOT_PAID,
    label: "Not paid",
    statuses: [OrderStatus.NEW, OrderStatus.NOT_PAID],
  },
  {
    key: OrderStatus.PROCESSING,
    label: "Processing",
    statuses: [OrderStatus.PROCESSING],
  },
  {
    key: OrderStatus.IN_PAYOUT,
    label: "In payout",
    statuses: [OrderStatus.IN_PAYOUT],
  },
  {
    key: OrderStatus.SUCCESS,
    label: "Success",
    statuses: [OrderStatus.SUCCESS],
  },
  { key: OrderStatus.HOLD, label: "Hold", statuses: [OrderStatus.HOLD] },
  {
    key: OrderStatus.RETURNED,
    label: "Returned",
    statuses: [OrderStatus.RETURNED],
  },
  {
    key: "error",
    label: "Error",
    statuses: [OrderStatus.ERROR_PAID, OrderStatus.ERROR_PAYOUT],
  },
  {
    key: OrderStatus.DELETED,
    label: "Deleted",
    statuses: [OrderStatus.DELETED],
  },
];

const getStatusBadgeClass = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.NEW:
    case OrderStatus.NOT_PAID:
      return "bg-slate-100 text-slate-700 border-slate-200";
    case OrderStatus.PROCESSING:
    case OrderStatus.IN_PAYOUT:
      return "bg-cyan-100 text-cyan-700 border-cyan-200";
    case OrderStatus.SUCCESS:
      return "bg-green-100 text-green-700 border-green-200";
    case OrderStatus.HOLD:
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case OrderStatus.RETURNED:
      return "bg-orange-100 text-orange-700 border-orange-200";
    case OrderStatus.ERROR_PAID:
    case OrderStatus.ERROR_PAYOUT:
      return "bg-red-100 text-red-700 border-red-200";
    case OrderStatus.DELETED:
      return "bg-rose-100 text-rose-800 border-rose-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const getStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    [OrderStatus.NEW]: "New",
    [OrderStatus.NOT_PAID]: "Not paid",
    [OrderStatus.PROCESSING]: "Processing",
    [OrderStatus.IN_PAYOUT]: "In payout",
    [OrderStatus.HOLD]: "Hold",
    [OrderStatus.SUCCESS]: "Success",
    [OrderStatus.RETURNED]: "Returned",
    [OrderStatus.ERROR_PAID]: "Error (Paid)",
    [OrderStatus.ERROR_PAYOUT]: "Error (Payout)",
    [OrderStatus.DELETED]: "Deleted",
  };
  return labels[status] || status;
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const currentTab = tabs.find((t) => t.key === activeTab);

      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", "20");

      if (search.trim()) {
        queryParams.append("search", search.trim());
      }

      if (currentTab && currentTab.statuses && currentTab.statuses.length > 0) {
        currentTab.statuses.forEach((status) => {
          queryParams.append("status", status);
        });
      }

      const res = await api.get<OrdersResponse>(
        `/order/all?${queryParams.toString()}`,
      );

      setOrders(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, search, activeTab]);

  const handleTabChange = (tabKey: TabKey) => {
    setActiveTab(tabKey);
    setPage(1);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <CardHeader
        title="Orders"
        description="Manage customer orders, track payments and process transactions"
      />

      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={[
                "px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap",
                activeTab === tab.key
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <SearchBar
        placeholder="Search by order ID, staff email or currency names and tickers"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      <Card>
        {loading ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Loading orders
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-slate-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Exchange
                  </th>
                  <th className="px-0 py-2.5 text-center text-xs font-medium text-slate-600 uppercase tracking-wider w-8"></th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider"></th>
                  <th className="hidden md:table-cell px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="hidden lg:table-cell px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="hidden md:table-cell px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/50 transition"
                  >
                    <td className="px-3 py-3 font-medium text-slate-900">
                      #{order.id}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-green-600/70">
                        {order.amountFrom}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.fromCurrency.name +
                          " " +
                          order.fromCurrency.ticker}
                      </div>
                    </td>
                    <td className="px-0 py-3 text-center">
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 mx-auto" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-red-600/70">
                        {order.amountTo}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.toCurrency.name + " " + order.toCurrency.ticker}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 py-3 text-slate-600 text-xs">
                      {order.rateFromTo || "-"}
                    </td>
                    <td className="hidden lg:table-cell px-3 py-3 text-slate-600 text-xs">
                      {order.staff?.email || "-"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={[
                          "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
                          getStatusBadgeClass(order.status),
                        ].join(" ")}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-3 py-3 text-slate-600 text-xs">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/orders/${order.id}`)}
                          className="px-2 py-1"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && orders.length > 0 && totalPages > 1 && (
          <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
