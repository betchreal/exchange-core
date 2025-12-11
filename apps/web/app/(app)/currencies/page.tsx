"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

type Currency = {
  id: number;
  name: string;
  ticker: string;
  code: string;
  reserve: string;
  active: boolean;
  merchantId: number | null;
  payoutId: number | null;
  amlId: number | null;
};

type CurrenciesResponse = {
  data: Currency[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function CurrenciesPage() {
  const router = useRouter();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const res = await api.get<CurrenciesResponse>("/currency/all", {
        params: {
          ...(search.trim() && { search: search.trim() }),
          page,
          limit: 20,
        },
      });
      setCurrencies(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, [page, search]);

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await api.patch(`/currency/${id}`, { active: !currentActive });
      fetchCurrencies();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to toggle currency status");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.delete(`/currency/${id}`);
      fetchCurrencies();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete currency");
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <CardHeader
        title="Currencies"
        description="Manage your currencies, activate/deactivate and configure settings"
      />

      <SearchBar
        placeholder="Search by name"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      <Card>
        {loading ? (
          <p className="text-center text-sm text-slate-500 py-8">
            Loading currencies
          </p>
        ) : currencies.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-8">
            No currencies found
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Ticker
                  </th>
                  <th className="hidden md:table-cell px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="hidden lg:table-cell px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Reserve
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Active
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currencies.map((currency) => (
                  <tr
                    key={currency.id}
                    className="hover:bg-slate-50/50 transition"
                  >
                    <td className="px-3 py-3 font-medium text-slate-900">
                      {currency.name}
                    </td>
                    <td className="px-3 py-3 text-slate-600 text-xs">
                      {currency.ticker}
                    </td>
                    <td className="hidden md:table-cell px-3 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {currency.code}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-3 py-3 text-slate-600 text-xs">
                      {currency.reserve || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Switch
                        checked={currency.active}
                        onChange={() =>
                          handleToggleActive(currency.id, currency.active)
                        }
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/currencies/${currency.id}`)
                          }
                          className="px-2 py-1"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDelete(currency.id, currency.name)
                          }
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200 px-2 py-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
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
