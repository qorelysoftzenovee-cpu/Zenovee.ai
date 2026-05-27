"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OutputRenderer } from "@/components/tools/output-renderer";
import type { ToolDefinition, ToolPreset } from "@/types/tools";
import { AlertDialog } from "@/components/ui/dialogs";
import { ArrowRight, Clock3, Sparkles, RefreshCcw, ShieldCheck } from "lucide-react";

type ToolRunnerTool = Pick<ToolDefinition, "id" | "metadata" | "fields" | "creditCost" | "presets" | "examples">;

type Props = {
  tool: ToolRunnerTool;
  workspaceId?: string | null;
  moduleId?: string | null;
};

export function ToolRunner({ tool, workspaceId = null, moduleId = null }: Props) {
  const [input, setInput] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<unknown>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [historyRows, setHistoryRows] = useState<Array<{ id: string; created_at: string; credits_consumed: number }>>([]);
  const [lastPayload, setLastPayload] = useState<Record<string, unknown> | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"txt" | "md" | "pdf" | "json" | null>(null);
  const [activePreset, setActivePreset] = useState<ToolPreset | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ open: boolean; title: string; description: string }>({
    open: false,
    title: "Premium access required",
    description: "Upgrade your plan to continue.",
  });

  const toolTagline = tool.metadata.tagline ?? tool.metadata.description;
  const toolOutputType = tool.metadata.outputType ?? "text";
  const estimatedTime = tool.metadata.estimatedTimeSeconds ? `${tool.metadata.estimatedTimeSeconds}s` : null;
  const activePresetId = activePreset?.label ?? "";
  const complexity = tool.metadata.complexity ? tool.metadata.complexity.toUpperCase() : null;

  const validationError = useMemo(() => {
    const missing = tool.fields.find((field) => field.required && String(input[field.name] ?? "").trim().length === 0);
    if (missing) return `${missing.label} is required.`;
    return null;
  }, [tool.fields, input]);

  const canRun = !validationError;

  const applyPreset = (preset: ToolPreset) => {
    setInput(preset.values);
    setActivePreset(preset);
    setError(null);
  };

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
        body: JSON.stringify({ toolId: tool.id, input: payloadInput, workspaceId, moduleId }),
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
      <div className="space-y-6">
        <Card className="overflow-hidden border-b-2 border-primary/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                  <Sparkles className="h-4 w-4" />
                  {tool.metadata.category}
                </div>
                <div className="space-y-1">
                  <h1 className="text-3xl font-semibold tracking-tight">{tool.metadata.name}</h1>
                  <p className="max-w-2xl text-sm leading-7 text-slate-300">{toolTagline}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-white/10 p-4 text-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Estimated output</p>
                  <p className="mt-2 text-base font-semibold text-white">{toolOutputType.replace("-", " ")}</p>
                  {tool.metadata.expectedOutputValue ? <p className="mt-2 text-xs text-slate-300">{tool.metadata.expectedOutputValue}</p> : null}
                </div>
                <div className="rounded-3xl bg-white/10 p-4 text-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Credits</p>
                  <p className="mt-2 text-base font-semibold text-white">{tool.creditCost} / run</p>
                  {tool.metadata.creditTooltip ? <p className="mt-2 text-xs text-slate-300">{tool.metadata.creditTooltip}</p> : null}
                </div>
                <div className="rounded-3xl bg-white/10 p-4 text-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Complexity</p>
                  <p className="mt-2 text-base font-semibold text-white">{complexity ?? "STANDARD"}</p>
                  <p className="mt-2 text-xs text-slate-300">{estimatedTime ?? "Fast premium output"}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {tool.metadata.premiumBadge ? <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-semibold text-primary-foreground/90">{tool.metadata.premiumBadge}</span> : null}
                {tool.metadata.expectedOutputValue ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200">{tool.metadata.expectedOutputValue}</span> : null}
              </div>
            </div>
          </CardHeader>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tool Builder</CardTitle>
          <p className="text-sm text-muted-foreground">Configure your input, use presets, and generate polished results with a single click.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-5">
            {tool.fields.map((field) => {
              const value = String(input[field.name] ?? "");
              return (
                <div key={field.name} className="rounded-3xl border border-border/70 bg-background p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{field.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{field.helperText ?? `Provide a strong ${field.label.toLowerCase()} to guide your output.`}</p>
                    </div>
                    {field.required ? <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Required</span> : null}
                  </div>
                  <div className="mt-4">
                    {field.type === "select" ? (
                      <select
                        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                        placeholder={field.placeholder ?? `Add your ${field.label.toLowerCase()} here...`}
                        className="min-h-[140px] rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    ) : (
                      <Input
                        value={value}
                        onChange={(e) => setInput((prev) => ({ ...prev, [field.name]: e.target.value }))}
                        placeholder={field.placeholder ?? `Type your ${field.label.toLowerCase()}...`}
                        className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {error ? <p className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</p> : null}
          {!error && validationError ? <p className="text-sm text-muted-foreground">{validationError}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void run()} disabled={loading || !canRun} className="min-w-[180px]">
              {loading ? "Generating…" : "Generate premium output"}
            </Button>
            <Button variant="secondary" onClick={() => void run(lastPayload ?? undefined)} disabled={loading || !lastPayload}>
              Retry last
            </Button>
            <Button variant="outline" onClick={() => void run()} disabled={loading || !canRun}>
              Improve output
            </Button>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/60 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Why this tool costs {tool.creditCost} credits</p>
            <p className="mt-1">{tool.metadata.creditTooltip ?? "Advanced AI workflows consume more credits due to larger generation complexity."}</p>
          </div>
        </CardContent>
      </Card>

      {tool.presets?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Presets</CardTitle>
            <p className="text-sm text-muted-foreground">Quick-start templates for faster premium results.</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            {tool.presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`rounded-3xl border px-4 py-4 text-left transition ${activePresetId === preset.label ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/80"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{preset.label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{preset.description ?? "Ready-made values to get you started."}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {tool.examples?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Example prompts</CardTitle>
            <p className="text-sm text-muted-foreground">Use these examples to inspire your next request.</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            {tool.examples.map((example) => (
              <div key={example.title} className="rounded-3xl border border-border/70 bg-background p-4 transition hover:border-primary/70 hover:shadow-sm">
                <p className="text-sm font-semibold text-foreground">{example.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{example.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>

      <div className="space-y-6">
        <Card className="border border-border/70 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Live workspace</p>
                <h2 className="mt-2 text-2xl font-semibold">Generated output</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm text-slate-200">
                <Clock3 className="h-4 w-4" />
                {loading ? "Generating…" : output ? "Ready to review" : "Awaiting input"}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="min-h-[420px] rounded-[2rem] border border-white/10 bg-slate-950/80 p-5">
              {loading ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-300">
                  <div className="h-3 w-48 rounded-full bg-white/10 animate-pulse" />
                  <p className="text-sm text-slate-400">Your premium output is being crafted with precision.</p>
                  <div className="flex h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/3 animate-pulse bg-primary" />
                  </div>
                </div>
              ) : (
                <OutputRenderer value={output} className="space-y-4" />
              )}
            </div>
          </CardContent>
          <div className="grid gap-3 border-t border-white/10 bg-slate-950/90 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-300">Need a tighter result? Regenerate or improve your current output.</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => void run(lastPayload ?? undefined)} disabled={loading || !lastPayload}>
                  <RefreshCcw className="h-4 w-4" />
                  Regenerate
                </Button>
                <Button variant="outline" onClick={() => void run()} disabled={loading || !canRun}>
                  Improve result
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void exportOutput("txt")} disabled={!executionId || exporting !== null}>
                Export TXT
              </Button>
              <Button variant="outline" onClick={() => void exportOutput("md")} disabled={!executionId || exporting !== null}>
                Export MD
              </Button>
              <Button variant="outline" onClick={() => void exportOutput("pdf")} disabled={!executionId || exporting !== null}>
                Export PDF
              </Button>
              <Button variant="outline" onClick={() => void exportOutput("json")} disabled={!executionId || exporting !== null}>
                Export JSON
              </Button>
            </div>
            {exportError ? <p className="text-sm text-destructive">{exportError}</p> : null}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <p className="text-sm text-muted-foreground">Track your last generated outputs and credit consumption.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyRows.length === 0 ? (
              <div className="rounded-3xl border border-border/70 bg-background p-6 text-sm text-muted-foreground">
                No recent runs yet. Your most recent outputs will appear here as soon as you generate them.
              </div>
            ) : (
              <div className="space-y-3">
                {historyRows.map((row) => (
                  <div key={row.id} className="rounded-3xl border border-border/70 bg-background p-4">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-foreground">{new Date(row.created_at).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Credits used: {row.credits_consumed}</p>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        <ShieldCheck className="h-4 w-4" />
                        Secure
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
