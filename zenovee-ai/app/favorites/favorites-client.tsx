"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { listToolDefinitions } from "@/definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FAVORITES_KEY = "zenovee_tool_favorites";

type SortMode = "name-asc" | "name-desc";

export function FavoritesClient() {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("name-asc");

  const favoriteIds = useMemo(() => {
    if (typeof window === "undefined") return [] as string[];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]");
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
      return [];
    }
  }, []);

  const tools = useMemo(
    () =>
      listToolDefinitions().filter(
        (tool) => favoriteIds.includes(tool.id) && tool.metadata.availability === "active" && (tool.metadata.visibility ?? "public") === "public"
      ),
    [favoriteIds]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const next = tools.filter((tool) => {
      if (!q) return true;
      return (
        tool.metadata.name.toLowerCase().includes(q) ||
        tool.metadata.description.toLowerCase().includes(q) ||
        tool.metadata.category.toLowerCase().includes(q)
      );
    });

    next.sort((a, b) =>
      sortMode === "name-asc"
        ? a.metadata.name.localeCompare(b.metadata.name)
        : b.metadata.name.localeCompare(a.metadata.name)
    );
    return next;
  }, [query, sortMode, tools]);

  return (
    <div className="space-y-6">
      <section className="premium-surface-elevated p-6">
        <p className="premium-label">Favorites</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Saved tools</h1>
      </section>

      <section className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search favorited tools" className="h-11 pl-10" />
        </div>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          aria-label="Sort favorites"
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
        </select>
      </section>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-slate-200 bg-white/80">
          <CardContent className="p-8 text-sm text-muted-foreground">No favorited tools match your search.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tool) => (
            <Card key={tool.id} className="border-slate-200 bg-white/95">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{tool.metadata.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">{tool.metadata.description}</p>
                <Button asChild size="sm">
                  <Link href={`/dashboard/tools/${tool.id}`}>Open Tool</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
