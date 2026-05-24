"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listToolDefinitions } from "@/definitions";

const CATEGORY_ORDER = ["LinkedIn", "Sales", "SEO", "Conversion", "Brand", "General"];
const FAVORITES_KEY = "zenovee_tool_favorites";
const RECENTS_KEY = "zenovee_recent_tools";

function resolveCategory(raw: string) {
  const c = raw.toLowerCase();
  if (c.includes("linkedin")) return "LinkedIn";
  if (c.includes("sales")) return "Sales";
  if (c.includes("seo")) return "SEO";
  if (c.includes("conversion") || c.includes("copy")) return "Conversion";
  if (c.includes("brand")) return "Brand";
  return "General";
}

function getBenefit(description: string) {
  const clean = description.trim();
  if (!clean) return "Solve workflow bottlenecks faster.";
  return clean.length > 88 ? `${clean.slice(0, 88)}…` : clean;
}

export function ToolsWorkspace() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [recentIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(RECENTS_KEY) ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const tools = useMemo(
    () =>
      listToolDefinitions()
        .filter((tool) => tool.metadata.availability === "active" && (tool.metadata.visibility ?? "public") === "public")
        .map((tool) => ({
          id: tool.id,
          name: tool.metadata.name,
          description: tool.metadata.description,
          creditCost: tool.creditCost,
          category: resolveCategory(tool.metadata.category),
        })),
    []
  );

  const categories = useMemo(() => {
    const set = new Set(tools.map((tool) => tool.category));
    return ["All", ...CATEGORY_ORDER.filter((c) => set.has(c))];
  }, [tools]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return tools.filter((tool) => {
      const passCategory = activeCategory === "All" || tool.category === activeCategory;
      const hay = `${tool.name} ${tool.description} ${tool.category}`.toLowerCase();
      const passQuery = !q || hay.includes(q);
      return passCategory && passQuery;
    });
  }, [tools, query, activeCategory]);

  const recentTools = useMemo(() => recentIds.map((id) => tools.find((t) => t.id === id)).filter(Boolean), [recentIds, tools]);
  const favoriteTools = useMemo(() => favoriteIds.map((id) => tools.find((t) => t.id === id)).filter(Boolean), [favoriteIds, tools]);

  const toggleFavorite = (id: string) => {
    const next = favoriteIds.includes(id) ? favoriteIds.filter((x) => x !== id) : [id, ...favoriteIds].slice(0, 24);
    setFavoriteIds(next);
    if (typeof window !== "undefined") window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  return (
    <div className="space-y-5">
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tools" className="h-11 border-slate-200 bg-white pl-10" />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === category
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {favoriteTools.slice(0, 3).map((tool) => (
          <Card key={`fav-${tool!.id}`} className="border-amber-200 bg-amber-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">⭐ {tool!.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">{getBenefit(tool!.description)}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">{tool!.creditCost} credits</p>
                <Link href={`/dashboard/tools/${tool!.id}`} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">Open</Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {recentTools.slice(0, 3).map((tool) => (
          <Card key={`recent-${tool!.id}`} className="border-blue-200 bg-blue-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">🕘 {tool!.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">{getBenefit(tool!.description)}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">{tool!.creditCost} credits</p>
                <Link href={`/dashboard/tools/${tool!.id}`} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">Open</Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.map((tool) => (
          <Card key={tool.id} className="border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{tool.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">{getBenefit(tool.description)}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">{tool.creditCost} credits</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => toggleFavorite(tool.id)} className="rounded-md border px-2 py-1 text-xs">
                    {favoriteIds.includes(tool.id) ? "★" : "☆"}
                  </button>
                  <Link href={`/dashboard/tools/${tool.id}`} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">
                  Open Tool
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
