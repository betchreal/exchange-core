"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { Button } from "@/components/ui/Button";
import { InlineError } from "@/components/ui/InlineError";
import { ConfigEditor, JsonSchema } from "@/components/ConfigEditor";
import { api } from "@/lib/axios";
import { PluginStatus } from "@exchange-core/common";

type AmlPlugin = {
  id: number;
  name: string;
  version: string;
  status: PluginStatus;
  configSchema: JsonSchema;
  config?: Record<string, any>;
};

export default function AmlPluginDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [plugin, setPlugin] = useState<AmlPlugin | null>(null);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPlugin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/aml/${id}`);
      setPlugin(response.data);
      setConfig(response.data.config ?? {});
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to load plugin",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugin();
  }, [id]);

  const handleLaunch = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/aml/launch/${id}`);
      await fetchPlugin();
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to launch plugin",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await api.post(`/aml/disable/${id}`);
      await fetchPlugin();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to disable plugin",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this plugin?")) return;

    setActionLoading(true);
    setError(null);
    try {
      await api.delete(`/aml/${id}`);
      router.push("/plugins/amls");
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to delete plugin",
      );
      setActionLoading(false);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      await api.put(`/aml/config/${id}`, { config });
      await fetchPlugin();
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to update config",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex w-full flex-col gap-6">
        <CardHeader title="Loading" description="Fetching plugin details" />
      </div>
    );
  }

  if (error && !plugin) {
    return (
      <div className="flex w-full flex-col gap-6">
        <CardHeader title="Error" description="Failed to load plugin" />
        <Card>
          <InlineError message={error} />
        </Card>
      </div>
    );
  }

  if (!plugin) {
    return (
      <div className="flex w-full flex-col gap-6">
        <CardHeader title="Not Found" description="Plugin not found" />
      </div>
    );
  }

  const hasConfigFields =
    plugin.configSchema?.type === "object" &&
    plugin.configSchema.properties &&
    Object.keys(plugin.configSchema.properties).length > 0;

  return (
    <div className="flex w-full flex-col gap-6">
      <CardHeader
        title={plugin.name}
        description={`Version ${plugin.version}`}
      />

      {error && <InlineError message={error} />}

      <Card>
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-slate-700">Status:</span>
            <span
              className={[
                "ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                plugin.status === PluginStatus.ACTIVE
                  ? "bg-green-100 text-green-800"
                  : plugin.status === PluginStatus.INSTALLED
                    ? "bg-slate-100 text-slate-800"
                    : "bg-red-100 text-red-800",
              ].join(" ")}
            >
              {plugin.status}
            </span>
          </div>

          <div className="flex gap-3 border-t border-slate-200 pt-4">
            <Button
              onClick={handleLaunch}
              disabled={plugin.status === PluginStatus.ACTIVE || actionLoading}
              loading={actionLoading}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Launch
            </Button>
            <Button
              onClick={handleDisable}
              disabled={plugin.status !== PluginStatus.ACTIVE || actionLoading}
              loading={actionLoading}
            >
              Disable
            </Button>
            <Button
              onClick={handleDelete}
              disabled={plugin.status === PluginStatus.ACTIVE || actionLoading}
              loading={actionLoading}
              variant="danger"
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleUpdateConfig} className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Configuration
          </h3>

          {!hasConfigFields ? (
            <p className="text-sm text-slate-500">
              No data required, just press 'Update Config' button
            </p>
          ) : (
            <ConfigEditor
              schema={plugin.configSchema}
              value={config}
              onChange={setConfig}
            />
          )}

          <div className="border-t border-slate-200 pt-4">
            <Button
              type="submit"
              loading={actionLoading}
              disabled={actionLoading}
            >
              Update Config
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
