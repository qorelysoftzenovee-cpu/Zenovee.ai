"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type HistoryRow = {
  id: string;
  tool_id: string;
  tool_name: string;
  output: unknown;
  credits_consumed: number;
  created_at: string;
};

const FAVORITES_KEY = "zenovee_history_favorites";
const REOPEN_KEY = "zenovee_history_reopen_item";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function HistoryClient({ initialRows }: { initialRows: HistoryRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const hasRows = rows.length > 0;
  const favoriteSet = new Set(favoriteIds);
  const visibleRows = useMemo(() => rows, [rows]);

  const previewById = useMemo(
    () =>
      Object.fromEntries(
        rows.map((row) => [
          row.id,
          JSON.stringify(row.output)
            .replaceAll("\n", " ")
            .slice(0, 120),
        ])
      ),
    [rows]
  );

  const persistFavorites = (next: string[]) => {
    setFavoriteIds(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    }
  };

  const reopen = (row: HistoryRow) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(REOPEN_KEY, JSON.stringify(row));
    }
    router.push("/dashboard/tools?fromHistory=1");
  };

  const exportRow = async (row: HistoryRow) => {
    setBusyId(row.id);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolUsageId: row.id, format: "json" }),
      });
      const json = await res.json();
      if (res.ok && json?.data?.signedUrl) {
        window.open(json.data.signedUrl, "_blank", "noopener,noreferrer");
      } else {
        setStatusMessage("Export failed. Please try again.");
      }
    } finally {
      setBusyId(null);
    }
  };

  const deleteRow = async (row: HistoryRow) => {
    setBusyId(row.id);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/exports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, kind: "generation" }),
      });
      if (res.ok) {
        setRows((prev) => prev.filter((item) => item.id !== row.id));
      } else {
        setStatusMessage("Could not delete this record right now.");
      }
    } finally {
      setBusyId(null);
    }
  };

  return !hasRows ? (
    <div className="empty-state">
      <div className="empty-state-icon">⏳</div>
      <p className="empty-state-title">No generations yet</p>
      <p className="empty-state-description">Once you run your first tool, your history will appear here with export and reopen actions.</p>
      <Button asChild className="empty-state-action"><Link href="/dashboard/tools">Open Workspace</Link></Button>
    </div>
  ) : (
    <div className="space-y-4">
      <section className="premium-surface-elevated p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="premium-label">History</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Execution log and output history</h2>
            <p className="mt-1 text-sm text-muted-foreground">Reopen runs, export results, and keep important outputs starred for quick access.</p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="stat-chip">{rows.length} records</span>
            <span className="stat-chip">{favoriteIds.length} favorites</span>
          </div>
        </div>
      </section>

      <Card className="premium-surface">
        <CardHeader><CardTitle>Recent generations</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto space-y-3">
        {statusMessage ? <p className="text-xs text-warning">{statusMessage}</p> : null}
        <table className="w-full min-w-[920px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr>
              <th className="pb-3">Tool</th>
              <th className="pb-3">Preview</th>
              <th className="pb-3">Created</th>
              <th className="pb-3">Credits</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((item) => (
              <tr key={item.id} className="border-t border-border/60 align-top">
                <td className="py-3 font-medium">{item.tool_name}</td>
                <td className="py-3 max-w-[320px] text-muted-foreground line-clamp-2">{previewById[item.id]}...</td>
                <td className="py-3 text-muted-foreground">{formatDate(item.created_at)}</td>
                <td className="py-3">{item.credits_consumed}</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => void exportRow(item)} disabled={busyId === item.id}>Export</Button>
                    <Button size="sm" variant="outline" onClick={() => reopen(item)} disabled={busyId === item.id}>Reopen</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === item.id}
                      onClick={() =>
                        persistFavorites(
                          favoriteIds.includes(item.id)
                            ? favoriteIds.filter((id) => id !== item.id)
                            : [item.id, ...favoriteIds]
                        )
                      }
                    >
                      {favoriteSet.has(item.id) ? "Favorited" : "Favorite"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void deleteRow(item)} disabled={busyId === item.id}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </CardContent>
      </Card>
    </div>
  );
}
