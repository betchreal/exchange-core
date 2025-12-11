"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { PluginType } from "@exchange-core/common";
import { Input } from "@/components/ui/Input";
import { Select, type SelectOption } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardHeader } from "@/components/ui/CardHeader";
import { api } from "@/lib/axios";
import { InlineError } from "@/components/ui/InlineError";

const pluginTypeOptions: SelectOption<PluginType>[] = [
  { value: PluginType.PARSER, label: "Parser" },
  { value: PluginType.PAYOUT, label: "Payout" },
  { value: PluginType.MERCHANT, label: "Merchant" },
  { value: PluginType.AML, label: "AML" },
];

export default function TicketsPage() {
  const [type, setType] = useState<PluginType>(PluginType.PARSER);
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const isFormValid = name.trim().length > 0 && version.trim().length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setLoading(true);
    setError(null);
    setTicket(null);

    try {
      const response = await api.post("/ticket", {
        name,
        version,
        type,
      });
      setTicket(response.data.ticket);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.message || "Failed to issue ticket";
      setError(Array.isArray(msg) ? msg.join("\n") : msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!ticket) return;
    try {
      await navigator.clipboard.writeText(ticket);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <CardHeader
        title="Issue plugin ticket"
        description="Ticket is a signed JWS token that authorizes downloading a specific plugin version"
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            id="type"
            name="type"
            label="Plugin type"
            value={type}
            onChange={(e) => setType(e.target.value as PluginType)}
            options={pluginTypeOptions}
            required
          />

          <Input
            ref={nameInputRef}
            id="name"
            name="name"
            label="Plugin name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my_plugin"
            minLength={1}
            maxLength={32}
            pattern="^[a-z0-9][a-z0-9_-]*$"
            helperText="Lowercase, digits, _ and -"
            required
          />

          <Input
            id="version"
            name="version"
            label="Version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0.0"
            minLength={1}
            maxLength={32}
            pattern="^[a-z0-9][a-z0-9_.-]*$"
            helperText="Lowercase, digits, ., _, -"
            required
          />

          {error && <InlineError message={error} />}

          <div className="flex justify-end">
            <Button type="submit" disabled={!isFormValid} loading={loading}>
              Issue ticket
            </Button>
          </div>
        </form>
      </Card>

      {ticket && (
        <Card className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-800">
                Issued ticket
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="max-h-40 overflow-y-auto rounded-lg bg-slate-900 px-3 py-2 text-xs font-mono text-slate-100">
            {ticket}
          </div>
        </Card>
      )}
    </div>
  );
}
