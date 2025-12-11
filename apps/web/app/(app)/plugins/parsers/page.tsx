"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { PluginCard } from "@/components/PluginCard";
import { Button } from "@/components/ui/Button";
import { InstallPluginModal } from "@/components/InstallPluginModal";
import { PluginStatus, PluginType } from "@exchange-core/common";
import { api } from "@/lib/axios";
import { SearchBar } from "@/components/ui/SearchBar";

type ParserPlugin = {
  id: number;
  name: string;
  version: string;
  status: PluginStatus;
};

export default function ParsersPage() {
  const [plugins, setPlugins] = useState<ParserPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [search, setSearch] = useState("");

  const fetchPlugins = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/parser/all");
      setPlugins(response.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to load plugins",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  const filteredPlugins = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return plugins;
    return plugins.filter((plugin) =>
      plugin.name.toLowerCase().includes(query),
    );
  }, [plugins, search]);

  if (loading) {
    return (
      <div className="flex w-full flex-col gap-6">
        <CardHeader
          title="Parser Plugins"
          description="Manage parser plugins for getting rates"
        />
        <div className="text-sm text-slate-500">Loading</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full flex-col gap-6">
        <CardHeader
          title="Parser Plugins"
          description="Manage parser plugins for getting rates"
        />
        <Card>
          <div className="text-sm text-red-600">{error}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <CardHeader
        title="Parser Plugins"
        description="Manage parser plugins for getting rates"
        action={
          <Button onClick={() => setShowInstallModal(true)}>
            Install Plugin
          </Button>
        }
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <SearchBar
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {plugins.length === 0 ? (
        <Card>
          <div className="text-center text-sm text-slate-500">
            No parser plugins installed yet
          </div>
        </Card>
      ) : filteredPlugins.length === 0 ? (
        <Card>
          <div className="text-center text-sm text-slate-500">
            No parser plugins match "{search}"
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlugins.map((plugin) => (
            <PluginCard
              key={plugin.id}
              id={plugin.id}
              name={plugin.name}
              version={plugin.version}
              status={plugin.status}
              type={PluginType.PARSER}
            />
          ))}
        </div>
      )}

      <InstallPluginModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        pluginType={PluginType.PARSER}
        onSuccess={fetchPlugins}
      />
    </div>
  );
}
