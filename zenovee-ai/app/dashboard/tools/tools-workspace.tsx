"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, Download, ExternalLink, History, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type ToolField = {
  name: string;
  label: string;
  type: "textarea" | "text" | "select" | "number" | "file";
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
};

type ToolItem = {
  id: string;
  metadata: {
    name: string;
    description: string;
    category: string;
    icon: string;
    availability?: "active" | "coming_soon";
    disabledReason?: string;
  };
  creditCost: number;
  fields: ToolField[];
  exportFormats?: Array<"txt" | "md" | "pdf" | "json" | "png">;
};

type ExportRecord = {
  id: string;
  tool_usage_id: string | null;
  storage_path: string | null;
  file_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type UsageHistoryItem = {
  id: string;
  tool_id: string;
  tool_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  credits_consumed: number;
  created_at: string;
  exports: ExportRecord[];
};

type ExportFormat = "txt" | "md" | "pdf" | "json" | "png";

function formatGlobalDateTime(dateValue: string) {
  return new Date(dateValue).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toReadableValue(value: unknown, depth = 0): string {
  const pad = "  ".repeat(depth);
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => `${pad}- ${toReadableValue(item, depth + 1).trimStart()}`).join("\n");
  return Object.entries(value as Record<string, unknown>)
    .map(([key, nested]) => `${pad}${key.replace(/([a-z])([A-Z])/g, "$1 $2")}:\n${toReadableValue(nested, depth + 1)}`)
    .join("\n");
}

export function ToolsWorkspace() {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [credits, setCredits] = useState(0);
  const [activeToolId, setActiveToolId] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [resultExecutionId, setResultExecutionId] = useState<string | null>(null);
  const [history, setHistory] = useState<UsageHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"result" | "history">("result");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [isExporting, setIsExporting] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeTool = useMemo(() => tools.find((t) => t.id === activeToolId) ?? null, [tools, activeToolId]);
  const availableFormats = activeTool?.exportFormats?.length ? activeTool.exportFormats : (["json"] as ExportFormat[]);
  const resolvedExportFormat = availableFormats.includes(exportFormat) ? exportFormat : availableFormats[0] ?? "json";
  const previewText = useMemo(() => (result ? toReadableValue(result) : ""), [result]);

  useEffect(() => {
    const init = async () => {
      setIsBootLoading(true);
      const res = await fetch("/api/tools", { method: "GET" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load tools");
        setIsBootLoading(false);
        return;
      }
      const loadedTools: ToolItem[] = json.data.tools;
      setTools(loadedTools);
      setCredits(json.data.credits ?? 0);
      if (loadedTools.length > 0) {
        setActiveToolId(loadedTools[0].id);
        setExportFormat((loadedTools[0].exportFormats?.[0] as ExportFormat | undefined) ?? "json");
      }
      setIsBootLoading(false);
    };
    void init();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!activeToolId) return;
      const res = await fetch(`/api/tools?mode=history&toolId=${encodeURIComponent(activeToolId)}&limit=12`);
      const json = await res.json();
      if (res.ok) setHistory(json.data ?? []);
    };
    void loadHistory();
  }, [activeToolId]);

  const onChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!activeTool) return "Please select a tool.";
    for (const field of activeTool.fields) {
      if (field.required && !String(formData[field.name] ?? "").trim()) {
        return `${field.label} is required.`;
      }
    }
    return null;
  };

  const runTool = async () => {
    setError(null);
    setSuccessMessage(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!activeTool) return;

    if (credits < activeTool.creditCost) {
      setError(`Insufficient credits. This tool requires ${activeTool.creditCost} credits. Upgrade to Continue or buy a credit topup.`);
      return;
    }

    if (activeTool.metadata.availability === "coming_soon") {
      setError(activeTool.metadata.disabledReason ?? "Coming soon");
      return;
    }

    setIsLoading(true);
    setActiveTab("result");
    const payload: Record<string, string> = { ...formData };
    const res = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId: activeTool.id, input: payload }),
    });
    const json = await res.json();
    setIsLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Generation failed.");
      return;
    }

    setResult(json.data);
    setResultExecutionId(json.executionId ?? null);
    setCredits(json.metrics?.creditsAfter ?? credits);
    setSuccessMessage("Output generated successfully. You can copy, publish, or export it now.");

    await refreshHistory(activeTool.id);
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(previewText || JSON.stringify(result, null, 2));
    setSuccessMessage("Output copied to clipboard.");
  };

  const refreshHistory = async (toolId = activeToolId) => {
    if (!toolId) return;
    const hRes = await fetch(`/api/tools?mode=history&toolId=${encodeURIComponent(toolId)}&limit=12`);
    const hJson = await hRes.json();
    if (hRes.ok) setHistory(hJson.data ?? []);
  };

  const openSignedUrl = (signedUrl: string) => {
    window.open(signedUrl, "_blank", "noopener,noreferrer");
  };

  const exportCurrentResult = async (format: ExportFormat) => {
    if (!resultExecutionId) return;
    setError(null);
    setIsExporting(true);
    const res = await fetch("/api/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolUsageId: resultExecutionId, format }),
    });
    const json = await res.json();
    setIsExporting(false);
    if (!res.ok) {
      setError(json.error ?? "Export failed.");
      return;
    }
    await refreshHistory();
    openSignedUrl(json.data.signedUrl);
  };

  const redownloadExport = async (exportId: string) => {
    setError(null);
    const res = await fetch(`/api/exports?id=${encodeURIComponent(exportId)}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to download export.");
      return;
    }
    openSignedUrl(json.data.signedUrl);
  };

  const deleteGeneration = async (generationId: string) => {
    setError(null);
    const res = await fetch("/api/exports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: generationId, kind: "generation" }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to delete generation.");
      return;
    }
    if (resultExecutionId === generationId) {
      setResult(null);
      setResultExecutionId(null);
    }
    await refreshHistory();
  };

  const publishCurrentResult = async () => {
    if (!resultExecutionId || !activeTool) return;

    setError(null);

    const res = await fetch("/api/outputs/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolUsageId: resultExecutionId,
        title: `${activeTool.metadata.name} Output`,
        description: `Public output generated with ${activeTool.metadata.name}.`,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Failed to publish output.");
      return;
    }

    setPublishedUrl(json.data.url);
    await navigator.clipboard.writeText(json.data.url);
    setSuccessMessage("Published URL copied to clipboard.");
  };

  const quickDownload = async (item: UsageHistoryItem | null, format: ExportFormat) => {
    if (!item) return;
    const existing = item.exports.find((entry) => entry.file_type === format);
    if (existing) {
      await redownloadExport(existing.id);
      return;
    }
    const res = await fetch("/api/exports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolUsageId: item.id, format }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to create export.");
      return;
    }
    await refreshHistory();
    openSignedUrl(json.data.signedUrl);
  };

  const currentHistoryItem = useMemo(() => history.find((item) => item.id === resultExecutionId) ?? null, [history, resultExecutionId]);
  const primaryDownloadFormat = (availableFormats[0] ?? "json") as ExportFormat;

  if (isBootLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader><CardTitle>Loading tools</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-muted/70" />)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Preparing workspace</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="h-11 animate-pulse rounded-xl bg-muted/70" />
            <div className="h-28 animate-pulse rounded-xl bg-muted/70" />
            <div className="h-11 animate-pulse rounded-xl bg-muted/70" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Tools</CardTitle>
          <p className="text-xs text-muted-foreground">Remaining credits: {credits}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="surface-muted mb-3 px-3 py-3 text-sm text-muted-foreground">
            Select a tool to generate a structured output, then export, publish, or reopen it from history.
          </div>
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => {
                setActiveToolId(tool.id);
                setFormData({});
                setResult(null);
                 setResultExecutionId(null);
                setPublishedUrl(null);
                setError(null);
                setSuccessMessage(null);
                setExportFormat((tool.exportFormats?.[0] as ExportFormat | undefined) ?? "json");
              }}
              className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition-all ${tool.id === activeToolId ? "border-primary bg-primary/5 shadow-sm" : "border-border/70 hover:bg-muted/50"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{tool.metadata.name}</span>
                <span className="text-xs">{tool.creditCost} cr</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{tool.metadata.description}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{activeTool?.metadata.name ?? "Tool"}</CardTitle>
            <p className="text-xs text-muted-foreground">Credit cost: {activeTool?.creditCost ?? 0}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="surface-muted flex items-start gap-3 px-4 py-4 text-sm text-muted-foreground">
              <Wand2 size={18} className="mt-0.5 shrink-0 text-accent" />
              <p>Fill in the required fields clearly for the best result. Your output is stored in history and can be exported later.</p>
            </div>
            {activeTool?.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea
                    placeholder={field.placeholder}
                    value={formData[field.name] ?? ""}
                    onChange={(e) => onChange(field.name, e.target.value)}
                  />
                ) : field.type === "select" ? (
                  <select
                    className="flex h-11 w-full rounded-xl border border-border/80 bg-background/85 px-3.5 py-2.5 text-sm shadow-sm outline-none transition-all focus-visible:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/35"
                    value={formData[field.name] ?? ""}
                    onChange={(e) => onChange(field.name, e.target.value)}
                  >
                    <option value="">Select</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "file" ? (
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onChange(field.name, e.target.files?.[0]?.name ?? "")}
                  />
                ) : (
                  <Input
                    placeholder={field.placeholder}
                    value={formData[field.name] ?? ""}
                    onChange={(e) => onChange(field.name, e.target.value)}
                  />
                )}
              </div>
            ))}
            {error ? <div className="status-danger flex items-start gap-2 rounded-2xl px-4 py-3 text-sm"><AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span></div> : null}
            {successMessage ? <div className="status-success flex items-start gap-2 rounded-2xl px-4 py-3 text-sm"><CheckCircle2 size={16} className="mt-0.5 shrink-0" /> <span>{successMessage}</span></div> : null}
            <Button
              onClick={runTool}
              disabled={isLoading || activeTool?.metadata.availability === "coming_soon"}
              className="w-full"
            >
              {isLoading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : activeTool?.metadata.availability === "coming_soon" ? "Coming soon" : <><Sparkles size={16} /> Run Tool</>}
            </Button>
            {activeTool && credits < activeTool.creditCost ? (
              <div className="status-warning rounded-2xl px-4 py-3 text-sm">
                Insufficient credits for this tool. <a href="/pricing" className="underline font-medium">Upgrade to Continue</a>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle>Output</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant={activeTab === "result" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("result")}>Result</Button>
                <Button variant={activeTab === "history" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("history")}><History size={14} /> History</Button>
                <Button variant="outline" size="sm" onClick={copyResult} disabled={!result}><Copy size={14} /> Copy</Button>
                <Button variant="outline" size="sm" onClick={() => void publishCurrentResult()} disabled={!resultExecutionId}><ExternalLink size={14} /> Publish</Button>
                <Button variant="outline" size="sm" onClick={() => void quickDownload(currentHistoryItem, primaryDownloadFormat)} disabled={!resultExecutionId || isExporting}><Download size={14} /> Download</Button>
                <select
                  className="h-9 rounded-lg border border-border/80 bg-background/85 px-2 text-sm"
                  value={resolvedExportFormat}
                  onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                  disabled={!resultExecutionId || isExporting}
                >
                  {availableFormats.map((format) => (
                    <option key={format} value={format}>
                      Export {format.toUpperCase()}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm" onClick={() => void exportCurrentResult(resolvedExportFormat)} disabled={!resultExecutionId || isExporting}>
                  {isExporting ? <><Loader2 size={14} className="animate-spin" /> Exporting...</> : "Export"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "result" ? (
              result ? (
                <div className="space-y-4">
                  {publishedUrl ? (
                    <div className="status-success rounded-2xl px-4 py-3 text-sm">
                      Published URL copied: <a href={publishedUrl} target="_blank" rel="noreferrer" className="text-accent underline">{publishedUrl}</a>
                    </div>
                  ) : null}
                  <pre className="subtle-scrollbar max-h-[420px] overflow-auto rounded-2xl border border-border/70 bg-muted/75 p-4 text-xs whitespace-pre-wrap">{previewText}</pre>
                  {currentHistoryItem?.exports?.length ? (
                    <div className="rounded-2xl border border-border/70 p-4">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Saved exports</p>
                      <div className="flex flex-wrap gap-2">
                        {currentHistoryItem.exports.map((file) => (
                          <Button key={file.id} variant="outline" size="sm" onClick={() => void redownloadExport(file.id)}>
                            {String(file.file_type).toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="surface-muted px-5 py-8 text-center">
                  <p className="text-base font-semibold">No output yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">Choose a tool, enter your prompt or input, and run it to generate a structured result you can copy, publish, and export.</p>
                </div>
              )
            ) : history.length > 0 ? (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-border/70 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.tool_name}</p>
                        <p className="text-xs text-muted-foreground">{formatGlobalDateTime(item.created_at)} • {item.credits_consumed} credits</p>
                        {item.exports.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.exports.map((file) => (
                              <span key={file.id} className="rounded-full border px-2 py-1 text-[11px] text-muted-foreground">
                                {String(file.file_type).toUpperCase()}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setResult(item.output);
                            setResultExecutionId(item.id);
                            setActiveTab("result");
                            setSuccessMessage("Previous output reopened.");
                          }}
                        >
                          Reopen
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void quickDownload(item, primaryDownloadFormat)}>
                          Download
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void deleteGeneration(item.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="surface-muted px-5 py-8 text-center">
                <p className="text-base font-semibold">No history for this tool yet</p>
                <p className="mt-2 text-sm text-muted-foreground">Once you generate results, they will appear here with export actions and quick reopen controls.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
