"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GROQ_MODELS, type AIModel } from "@/services/ai/models";

type ToolPromptMetadata = {
  modelOverride?: AIModel;
  systemPromptAppend?: string;
  userPromptAppend?: string;
  defaultTone?: string;
  defaultWritingStyle?: string;
  defaultOutputLength?: "short" | "medium" | "long";
  defaultLanguage?: string;
  maxValidationRetries?: number;
};

type ToolPricingItem = {
  toolId: string;
  toolName: string;
  category: string;
  creditsCost: number;
  isActive: boolean;
  cooldownSeconds: number;
  metadata?: ToolPromptMetadata | null;
  premiumBadge?: string | null;
  complexity?: string | null;
  expectedOutputValue?: string | null;
};

export function ToolPricingManager({ items }: { items: ToolPricingItem[] }) {
  const [rows, setRows] = useState(items);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const updateRow = (toolId: string, patch: Partial<ToolPricingItem>) => {
    setRows((current) => current.map((row) => (row.toolId === toolId ? { ...row, ...patch } : row)));
  };

  const saveRow = async (row: ToolPricingItem) => {
    setSavingId(row.toolId);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/tool-pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolId: row.toolId,
          creditsCost: row.creditsCost,
          isActive: row.isActive,
          cooldownSeconds: row.cooldownSeconds,
          metadata: row.metadata ?? {},
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setStatus(json.error ?? `Failed to update ${row.toolName}.`);
        setSavingId(null);
        return;
      }

      setStatus(`${row.toolName} updated successfully.`);
    } catch {
      setStatus(`Failed to update ${row.toolName}.`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {status ? <div className="surface-muted px-4 py-3 text-sm text-muted-foreground">{status}</div> : null}
      {rows.map((row) => (
        <div key={row.toolId} className="surface-muted space-y-4 rounded-2xl p-4">
          <div className="grid gap-3 md:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr_auto] md:items-center">
            <div>
              <p className="font-semibold">{row.toolName}</p>
              <p className="text-xs text-muted-foreground">{row.toolId} • {row.category}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                {row.complexity ? <span className="rounded-full border px-2 py-1 uppercase">{row.complexity}</span> : null}
                {row.premiumBadge ? <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-1 text-primary">{row.premiumBadge}</span> : null}
                {row.expectedOutputValue ? <span className="rounded-full border px-2 py-1">{row.expectedOutputValue}</span> : null}
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs text-muted-foreground">Credits</p>
              <Input
                type="number"
                min={1}
                value={row.creditsCost}
                onChange={(e) => updateRow(row.toolId, { creditsCost: Number(e.target.value) || 1 })}
              />
            </div>

            <div>
              <p className="mb-1 text-xs text-muted-foreground">Cooldown (sec)</p>
              <Input
                type="number"
                min={0}
                value={row.cooldownSeconds}
                onChange={(e) => updateRow(row.toolId, { cooldownSeconds: Number(e.target.value) || 0 })}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={row.isActive}
                onChange={(e) => updateRow(row.toolId, { isActive: e.target.checked })}
              />
              Active
            </label>

            <Button onClick={() => void saveRow(row)} disabled={savingId === row.toolId}>
              {savingId === row.toolId ? "Saving..." : "Save"}
            </Button>
          </div>

          <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Model override</p>
                <select
                  className="flex h-11 w-full rounded-xl border border-border/80 bg-background/85 px-3.5 py-2.5 text-sm"
                  value={row.metadata?.modelOverride ?? ""}
                  onChange={(e) => updateRow(row.toolId, { metadata: { ...row.metadata, modelOverride: (e.target.value || undefined) as ToolPromptMetadata["modelOverride"] } })}
                >
                  <option value="">Auto-select</option>
                  {GROQ_MODELS.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Default tone</p>
                  <Input
                    value={row.metadata?.defaultTone ?? ""}
                    onChange={(e) => updateRow(row.toolId, { metadata: { ...row.metadata, defaultTone: e.target.value || undefined } })}
                    placeholder="Professional"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Default writing style</p>
                  <Input
                    value={row.metadata?.defaultWritingStyle ?? ""}
                    onChange={(e) => updateRow(row.toolId, { metadata: { ...row.metadata, defaultWritingStyle: e.target.value || undefined } })}
                    placeholder="Publish-ready"
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Default output length</p>
                  <select
                    className="flex h-11 w-full rounded-xl border border-border/80 bg-background/85 px-3.5 py-2.5 text-sm"
                    value={row.metadata?.defaultOutputLength ?? ""}
                    onChange={(e) => updateRow(row.toolId, { metadata: { ...row.metadata, defaultOutputLength: (e.target.value || undefined) as ToolPromptMetadata["defaultOutputLength"] } })}
                  >
                    <option value="">Use tool default</option>
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Default language</p>
                  <Input
                    value={row.metadata?.defaultLanguage ?? ""}
                    onChange={(e) => updateRow(row.toolId, { metadata: { ...row.metadata, defaultLanguage: e.target.value || undefined } })}
                    placeholder="English"
                  />
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted-foreground">Validation retries</p>
                <Input
                  type="number"
                  min={0}
                  max={3}
                  value={row.metadata?.maxValidationRetries ?? 2}
                  onChange={(e) => updateRow(row.toolId, { metadata: { ...row.metadata, maxValidationRetries: Number(e.target.value) || 0 } })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">System prompt append</p>
                <Textarea
                  value={row.metadata?.systemPromptAppend ?? ""}
                  onChange={(e) => updateRow(row.toolId, { metadata: { ...row.metadata, systemPromptAppend: e.target.value || undefined } })}
                  placeholder="Additional system-level guardrails or quality instructions"
                  className="min-h-28"
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-muted-foreground">User prompt append</p>
                <Textarea
                  value={row.metadata?.userPromptAppend ?? ""}
                  onChange={(e) => updateRow(row.toolId, { metadata: { ...row.metadata, userPromptAppend: e.target.value || undefined } })}
                  placeholder="Extra tool-specific context or structural rules"
                  className="min-h-28"
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
