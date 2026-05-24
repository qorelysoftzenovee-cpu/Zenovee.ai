"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OutputRenderer } from "@/components/tools/output-renderer";
import type { ToolDefinition } from "@/types/tools";
import { AlertDialog } from "@/components/ui/dialogs";

type Props = {
  tool: ToolDefinition;
};

export function ToolRunner({ tool }: Props) {
  const [input, setInput] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<unknown>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [historyRows, setHistoryRows] = useState<Array<{ id: string; created_at: string; credits_consumed: number }>>([]);
  const [lastPayload, setLastPayload] = useState<Record<string, unknown> | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"txt" | "md" | "pdf" | "json" | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; title: string; description: string }>({
    open: false,
    title: "Premium access required",
    description: "Upgrade your plan to continue.",
  });

  const validationError = useMemo(() => {
    const missing = tool.fields.find((field) => field.required && String(input[field.name] ?? "").trim().length === 0);
    if (missing) return `${missing.label} is required.`;
    return null;
  }, [tool.fields, input]);

  const canRun = !validationError;

  const run = async (nextInput?: Record<string, unknown>) => {
    const payloadInput = nextInput ?? input;
    const missing = tool.fields.find((field) => field.required && String(payloadInput[field.name] ?? "").trim().length === 0);
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }

    setLoading(true);
    setError(null);
    setExportError(null);
    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: tool.id, input: payloadInput }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        const code = String(json?.code ?? "");
        if (code === "SUBSCRIPTION_REQUIRED" || code === "INSUFFICIENT_CREDITS" || code === "TOOL_DISABLED") {
          setUpgradeModal({
            open: true,
            title:
              code === "SUBSCRIPTION_REQUIRED"
                ? "Upgrade required"
                : code === "INSUFFICIENT_CREDITS"
                ? "Credits required"
                : "Tool unavailable",
            description:
              code === "SUBSCRIPTION_REQUIRED"
                ? "You need an active plan to use this tool."
                : code === "INSUFFICIENT_CREDITS"
                ? "You don’t have enough credits. Top up or upgrade to continue."
                : "This tool is temporarily unavailable. Please try again later.",
          });
        }
        throw new Error(json?.error ?? "Execution failed.");
      }
      setOutput(json.data);
      setExecutionId(json.executionId ?? null);
      setLastPayload(payloadInput);

      if (typeof window !== "undefined") {
        const key = "zenovee_recent_tools";
        const prev = JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[];
        const next = [tool.id, ...prev.filter((id) => id !== tool.id)].slice(0, 12);
        window.localStorage.setItem(key, JSON.stringify(next));
      }

      const historyRes = await fetch(`/api/tools?mode=history&toolId=${encodeURIComponent(tool.id)}&limit=6`);
      const historyJson = await historyRes.json();
      if (historyRes.ok && historyJson?.success && Array.isArray(historyJson.data)) {
        setHistoryRows(
          historyJson.data.map((row: { id: string; created_at: string; credits_consumed: number }) => ({
            id: row.id,
            created_at: row.created_at,
            credits_consumed: row.credits_consumed,
          }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execution failed.");
    } finally {
      setLoading(false);
    }
  };

  const exportOutput = async (format: "txt" | "md" | "pdf" | "json") => {
    if (!executionId) return;
    setExporting(format);
    setExportError(null);
    try {
      const res = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolUsageId: executionId, format }),
      });
      const json = await res.json();
      if (!res.ok || !json?.data?.signedUrl) {
        throw new Error(json?.error ?? "Export failed. Please retry.");
      }
      window.open(json.data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed. Please retry.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <AlertDialog
        isOpen={upgradeModal.open}
        onClose={() => setUpgradeModal((prev) => ({ ...prev, open: false }))}
        title={upgradeModal.title}
        description={upgradeModal.description}
        actionLabel="View plans"
        action={() => {
          window.location.href = "/pricing";
        }}
        variant="warning"
      />
      <Card>
        <CardHeader>
          <CardTitle>{tool.metadata.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{tool.metadata.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {tool.fields.map((field) => {
            const value = String(input[field.name] ?? "");
            return (
              <div key={field.name} className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                {field.type === "select" ? (
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={value}
                    onChange={(e) => setInput((prev) => ({ ...prev, [field.name]: e.target.value }))}
                  >
                    <option value="">Select {field.label}</option>
                    {(field.options ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <Textarea
                    value={value}
                    onChange={(e) => setInput((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    placeholder={field.placeholder ?? `Enter ${field.label}`}
                  />
                ) : (
                  <Input
                    value={value}
                    onChange={(e) => setInput((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    placeholder={field.placeholder ?? `Enter ${field.label}`}
                  />
                )}
              </div>
            );
          })}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!error && validationError ? <p className="text-xs text-muted-foreground">{validationError}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void run()} disabled={loading || !canRun}>{loading ? "Generating..." : "Run Tool"}</Button>
            <Button variant="secondary" onClick={() => void run(lastPayload ?? undefined)} disabled={loading || !lastPayload}>Retry last</Button>
            <Button variant="outline" onClick={() => void run()} disabled={loading || !canRun}>Improve output</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Premium Output</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <OutputRenderer value={output} />
          {exportError ? <p className="text-xs text-destructive">{exportError}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void exportOutput("txt")} disabled={!executionId || exporting !== null}>{exporting === "txt" ? "Exporting..." : "Export TXT"}</Button>
            <Button variant="outline" onClick={() => void exportOutput("md")} disabled={!executionId || exporting !== null}>{exporting === "md" ? "Exporting..." : "Export MD"}</Button>
            <Button variant="outline" onClick={() => void exportOutput("pdf")} disabled={!executionId || exporting !== null}>{exporting === "pdf" ? "Exporting..." : "Export PDF"}</Button>
            <Button variant="outline" onClick={() => void exportOutput("json")} disabled={!executionId || exporting !== null}>{exporting === "json" ? "Exporting..." : "Export JSON"}</Button>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Recent runs</p>
            <div className="space-y-1">
              {historyRows.length === 0 ? (
                <p className="text-xs text-muted-foreground">No run history yet for this tool.</p>
              ) : (
                historyRows.map((row) => (
                  <div key={row.id} className="flex items-center justify-between rounded-md border px-2 py-1 text-xs">
                    <span>{new Date(row.created_at).toLocaleString()}</span>
                    <span>{row.credits_consumed} credits</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
