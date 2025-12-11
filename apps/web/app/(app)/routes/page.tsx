"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { SearchBar } from "@/components/ui/SearchBar";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ArrowRight } from "lucide-react";

type Route = {
  id: number;
  fromCurrency: {
    id: number;
    name: string;
    ticker: string;
  };
  toCurrency: {
    id: number;
    name: string;
    ticker: string;
  };
  rate: string | null;
  commissionPercentage: string;
  active: boolean;
};

type RoutesResponse = {
  data: Route[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function RoutesPage() {
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await api.get<RoutesResponse>("/route/all", {
        params: {
          ...(search.trim() && { search: search.trim() }),
          page,
          limit: 20,
        },
      });
      setRoutes(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [page, search]);

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await api.patch(`/route/${id}`, { active: !currentActive });
      fetchRoutes();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to toggle route status");
    }
  };

  const handleDelete = async (id: number, fromName: string, toName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete route "${fromName} -> ${toName}"?`,
      )
    )
      return;

    try {
      await api.delete(`/route/${id}`);
      fetchRoutes();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete route");
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <CardHeader
        title="Routes"
        description="Manage your exchange routes, activate/deactivate and configure settings"
      />

      <SearchBar
        placeholder="Search by currency name"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      <Card>
        {loading ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Loading routes
          </div>
        ) : routes.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-slate-500 mb-4">
              No routes found. Create your first route to get started
            </p>
            <Button onClick={() => router.push("/routes/create")}>
              Create route
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-slate-600 uppercase tracking-wider w-8"></th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="hidden md:table-cell px-3 py-2.5 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Commission
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
                {routes.map((route) => (
                  <tr
                    key={route.id}
                    className="hover:bg-slate-50/50 transition"
                  >
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">
                        {route.fromCurrency.name}
                      </div>
                      <div className="text-xs text-slate-600">
                        {route.fromCurrency.ticker}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <ArrowRight className="h-4 w-4 text-slate-400 mx-auto" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">
                        {route.toCurrency.name}
                      </div>
                      <div className="text-xs text-slate-600">
                        {route.toCurrency.ticker}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600 text-xs">
                      {route.rate ? (
                        route.rate
                      ) : (
                        <span className="text-slate-400 italic">
                          No parser set
                        </span>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-3 py-3 text-slate-600 text-xs">
                      {route.commissionPercentage}%
                    </td>
                    <td className="px-3 py-3">
                      <Switch
                        checked={route.active}
                        onChange={() =>
                          handleToggleActive(route.id, route.active)
                        }
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/routes/${route.id}`)}
                          className="px-2 py-1"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDelete(
                              route.id,
                              route.fromCurrency.name,
                              route.toCurrency.name,
                            )
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

        {!loading && routes.length > 0 && totalPages > 1 && (
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
