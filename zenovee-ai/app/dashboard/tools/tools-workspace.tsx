"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Download,
  History,
  Loader2,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ToolField = {
  name: string;
  label: string;
  type: "textarea" | "text" | "select";
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
};

type ToolItem = {
  id: string;
  creditCost: number;
  metadata: {
    name: string;
    description: string;
    category: string;
    icon: string;
  };
  fields: ToolField[];
};

type UsageHistoryItem = {
  id: string;
  tool_id: string;
  tool_name: string;
  output: Record<string, unknown>;
  created_at: string;
  credits_consumed: number;
};

const GROUP_ORDER = [
  "LinkedIn Authority OS",
  "Sales Outreach OS",
  "SEO Engine",
  "Conversion Copy OS",
  "Brand Studio",
];

const HISTORY_REOPEN_STORAGE_KEY = "zenovee_history_reopen_item";

const mapCategoryToGroup = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes("linkedin")) return "LinkedIn Authority OS";
  if (c.includes("sales")) return "Sales Outreach OS";
  if (c.includes("seo")) return "SEO Engine";
  if (c.includes("conversion") || c.includes("copy")) return "Conversion Copy OS";
  return "Brand Studio";
};

const toReadable = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
};

export function ToolsWorkspace() {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [historyRows, setHistoryRows] = useState<UsageHistoryItem[]>([]);
  const [activeToolId, setActiveToolId] = useState("");
  const [activeTab, setActiveTab] = useState<"result" | "history" | "saved">("result");
  const [query, setQuery] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [resultExecutionId, setResultExecutionId] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const activeTool = useMemo(() => tools.find((t) => t.id === activeToolId) ?? null, [tools, activeToolId]);

  const groupedTools = useMemo(() => {
    const filtered = tools.filter((t) => {
      const hay = `${t.metadata.name} ${t.metadata.category}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    });
    return GROUP_ORDER.map((group) => ({
      group,
      items: filtered.filter((t) => mapCategoryToGroup(t.metadata.category) === group),
    })).filter((g) => g.items.length);
  }, [tools, query]);

  const preview = useMemo(() => (result ? toReadable(result) : ""), [result]);
  const savedRows = useMemo(() => historyRows.filter((r) => savedIds.includes(r.id)), [historyRows, savedIds]);

  useEffect(() => {
    const boot = async () => {
      setLoading(true);
      const res = await fetch("/api/tools");
      const json = await res.json();
      if (res.ok) {
        setTools(json.data.tools ?? []);
        setCredits(json.data.credits ?? 0);
        const first = (json.data.tools ?? [])[0];
        if (first) setActiveToolId(first.id);
      }
      const savedRaw = localStorage.getItem("zenovee_workspace_saved_outputs");
      if (savedRaw) setSavedIds(JSON.parse(savedRaw));
      setLoading(false);
    };
    void boot();
  }, []);

  useEffect(() => {
    if (!activeToolId) return;
    const loadHistory = async () => {
      const res = await fetch(`/api/tools?mode=history&toolId=${encodeURIComponent(activeToolId)}&limit=20`);
      const json = await res.json();
      if (res.ok) setHistoryRows(json.data ?? []);
    };
    void loadHistory();
  }, [activeToolId]);

  useEffect(() => {
    localStorage.setItem("zenovee_workspace_saved_outputs", JSON.stringify(savedIds));
  }, [savedIds]);

  useEffect(() => {
    if (!tools.length) return;
    const raw = localStorage.getItem(HISTORY_REOPEN_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { id?: string; tool_id?: string; output?: Record<string, unknown> };
      if (parsed.tool_id) setActiveToolId(parsed.tool_id);
      if (parsed.output) setResult(parsed.output);
      if (parsed.id) setResultExecutionId(parsed.id);
      setActiveTab("result");
    } finally {
      localStorage.removeItem(HISTORY_REOPEN_STORAGE_KEY);
    }
  }, [tools]);

  const runTool = async () => {
    if (!activeTool) return;
    setRunning(true);
    const res = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId: activeTool.id, input: formData }),
    });
    const json = await res.json();
    if (res.ok) {
      setResult(json.data);
      setResultExecutionId(json.executionId ?? null);
      setCredits(json.metrics?.creditsAfter ?? credits);
      setActiveTab("result");
    }
    setRunning(false);
  };

  if (loading) {
    return <div className="loading-skeleton h-[70vh] rounded-3xl" />;
  }

  return (
    <div className="grid min-h-[72vh] gap-4 xl:grid-cols-[280px_minmax(0,1fr)_420px]">
      <aside className="rounded-2xl border border-white/10 bg-[#0e1424]/75 p-3">
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tools" className="pl-10" />
        </div>
        <div className="space-y-4 overflow-y-auto pr-1 max-h-[66vh]">
          {groupedTools.map((group) => (
            <div key={group.group}>
              <p className="mb-2 px-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{group.group}</p>
              <div className="space-y-1.5">
                {group.items.map((tool) => {
                  const active = tool.id === activeToolId;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveToolId(tool.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${active ? "bg-primary/20 text-primary-foreground" : "hover:bg-white/5"}`}
                    >
                      <span className="truncate text-sm">{tool.metadata.icon} {tool.metadata.name}</span>
                      <span className="text-xs text-muted-foreground">{tool.creditCost}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="rounded-2xl border border-white/10 bg-[#0b1220]/80 p-5">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Input Workspace</p>
          <h2 className="mt-1 text-xl font-semibold">{activeTool?.metadata.name ?? "Select a tool"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{activeTool?.metadata.description ?? "Choose a tool to begin."}</p>
        </div>

        <div className="space-y-4">
          {activeTool?.fields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label>{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea value={formData[field.name] ?? ""} onChange={(e) => setFormData((p) => ({ ...p, [field.name]: e.target.value }))} placeholder={field.placeholder} className="min-h-28" />
              ) : field.type === "select" ? (
                <select className="flex h-10 w-full rounded-lg border border-white/10 bg-background px-3 text-sm" value={formData[field.name] ?? ""} onChange={(e) => setFormData((p) => ({ ...p, [field.name]: e.target.value }))}>
                  <option value="">Select</option>
                  {field.options?.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              ) : (
                <Input value={formData[field.name] ?? ""} onChange={(e) => setFormData((p) => ({ ...p, [field.name]: e.target.value }))} placeholder={field.placeholder} />
              )}
            </div>
          ))}

          <details className="rounded-xl border border-white/10 p-3">
            <summary className="cursor-pointer text-sm font-medium">Advanced options</summary>
            <p className="mt-2 text-sm text-muted-foreground">Fine-tune your prompt quality from here in next iteration.</p>
          </details>

          <Button className="w-full" onClick={() => void runTool()} disabled={running || !activeTool}>
            {running ? <><Loader2 className="size-4 animate-spin" /> Generating...</> : <><Sparkles className="size-4" /> Generate</>}
          </Button>
        </div>
      </section>

      <aside className="sticky top-20 h-fit rounded-2xl border border-white/10 bg-[#0f1729]/80 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-1 rounded-lg bg-white/5 p-1 text-xs">
            {(["result", "history", "saved"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-md px-2 py-1 ${activeTab === tab ? "bg-primary/25" : ""}`}>{tab[0].toUpperCase() + tab.slice(1)}</button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{credits} credits</p>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(preview)}><Copy className="size-3.5" /> Copy</Button>
          <Button size="sm" variant="outline"><Download className="size-3.5" /> Export</Button>
          <Button size="sm" variant="outline" onClick={() => resultExecutionId && setSavedIds((p) => (p.includes(resultExecutionId) ? p : [resultExecutionId, ...p]))}><Save className="size-3.5" /> Save</Button>
          <Button size="sm" variant="outline" onClick={() => void runTool()}><RefreshCcw className="size-3.5" /> Regenerate</Button>
        </div>

        <div className="max-h-[58vh] overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
          {activeTab === "result" ? (
            preview ? <pre className="whitespace-pre-wrap text-xs leading-6 text-slate-200">{preview}</pre> : <p className="text-sm text-muted-foreground">No output yet.</p>
          ) : activeTab === "history" ? (
            <div className="space-y-2">
              {historyRows.length ? historyRows.map((row) => (
                <button key={row.id} className="w-full rounded-lg border border-white/10 p-2 text-left hover:bg-white/5" onClick={() => { setResult(row.output); setResultExecutionId(row.id); setActiveTab("result"); }}>
                  <p className="text-xs font-medium">{row.tool_name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{toReadable(row.output)}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground"><History className="mr-1 inline size-3" />{row.credits_consumed} credits</p>
                </button>
              )) : <p className="text-sm text-muted-foreground">No history yet.</p>}
            </div>
          ) : (
            <div className="space-y-2">
              {savedRows.length ? savedRows.map((row) => (
                <button key={row.id} className="w-full rounded-lg border border-white/10 p-2 text-left hover:bg-white/5" onClick={() => { setResult(row.output); setResultExecutionId(row.id); setActiveTab("result"); }}>
                  <p className="text-xs font-medium">{row.tool_name}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Saved output</p>
                </button>
              )) : <p className="text-sm text-muted-foreground">No saved outputs.</p>}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
