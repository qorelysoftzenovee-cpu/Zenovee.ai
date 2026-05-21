"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type WorkspaceItem = {
  workspaceId: string;
  name: string;
  visibility: "public" | "private";
  audiencePresets: string[];
  tonePresets: string[];
  templatePresets: string[];
  modelOverride?: string;
  promptOverride?: Record<string, unknown>;
};

export function WorkspaceGovernanceManager({ items }: { items: WorkspaceItem[] }) {
  const [rows, setRows] = useState(items);
  const [savingId, setSavingId] = useState<string | null>(null);

  const updateRow = (workspaceId: string, patch: Partial<WorkspaceItem>) => {
    setRows((current) => current.map((row) => (row.workspaceId === workspaceId ? { ...row, ...patch } : row)));
  };

  const save = async (row: WorkspaceItem) => {
    setSavingId(row.workspaceId);
    try {
      await fetch("/api/admin/workspaces", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.workspaceId} className="surface-muted rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{row.name}</p>
              <p className="text-xs text-muted-foreground">{row.workspaceId}</p>
            </div>
            <Button onClick={() => void save(row)} disabled={savingId === row.workspaceId}>{savingId === row.workspaceId ? "Saving..." : "Save"}</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="h-10 rounded-xl border border-border/80 bg-background px-3 text-sm"
              value={row.visibility}
              onChange={(e) => updateRow(row.workspaceId, { visibility: e.target.value as "public" | "private" })}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
            <Input value={row.audiencePresets.join(", ")} onChange={(e) => updateRow(row.workspaceId, { audiencePresets: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} placeholder="Audience presets" />
            <Input value={row.tonePresets.join(", ")} onChange={(e) => updateRow(row.workspaceId, { tonePresets: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} placeholder="Tone presets" />
            <Input value={row.templatePresets.join(", ")} onChange={(e) => updateRow(row.workspaceId, { templatePresets: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} placeholder="Template presets" />
            <Input value={row.modelOverride ?? ""} onChange={(e) => updateRow(row.workspaceId, { modelOverride: e.target.value })} placeholder="Model override" />
            <Input
              value={JSON.stringify(row.promptOverride ?? {})}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value || "{}");
                  if (parsed && typeof parsed === "object") updateRow(row.workspaceId, { promptOverride: parsed });
                } catch {
                  // ignore invalid draft json
                }
              }}
              placeholder='Prompt override JSON e.g. {"systemAppend":"..."}'
            />
          </div>
        </div>
      ))}
    </div>
  );
}
