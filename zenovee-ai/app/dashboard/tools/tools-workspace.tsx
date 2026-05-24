"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Flame, Search, Sparkles, Star } from "lucide-react";
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

function categoryTone(category: string) {
  if (category === "LinkedIn") return "bg-violet-50 border-violet-200 text-violet-700";
  if (category === "Sales") return "bg-blue-50 border-blue-200 text-blue-700";
  if (category === "SEO") return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (category === "Conversion") return "bg-amber-50 border-amber-200 text-amber-700";
  if (category === "Brand") return "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700";
  return "bg-slate-50 border-slate-200 text-slate-700";
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
          featured: Boolean(tool.metadata.featured),
          trending: Boolean(tool.metadata.trending),
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
  const featuredTools = useMemo(() => tools.filter((tool) => tool.featured).slice(0, 4), [tools]);
  const trendingTools = useMemo(() => tools.filter((tool) => tool.trending).slice(0, 4), [tools]);

  const toggleFavorite = (id: string) => {
    const next = favoriteIds.includes(id) ? favoriteIds.filter((x) => x !== id) : [id, ...favoriteIds].slice(0, 24);
    setFavoriteIds(next);
    if (typeof window !== "undefined") window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  return (
    <div className="space-y-5">
      <section className="premium-surface-elevated p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="premium-label">Tool Explorer</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Premium AI systems directory</h1>
            <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
              Search across all enterprise tools, jump into featured systems, and keep your favorite workflows one click away.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="stat-chip">{tools.length} total tools</span>
            <span className="stat-chip">{favoriteIds.length} favorites</span>
            <span className="stat-chip">{categories.length - 1} categories</span>
          </div>
        </div>
      </section>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by tool name, category, or workflow" className="h-11 border-slate-200 bg-white pl-10" />
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
        {featuredTools.map((tool) => (
          <Card key={`featured-${tool.id}`} className="premium-surface border-violet-200/70 bg-gradient-to-br from-violet-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Sparkles size={15} className="text-violet-500" /> {tool.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">{getBenefit(tool.description)}</p>
              <div className="flex items-center justify-between">
                <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${categoryTone(tool.category)}`}>{tool.category}</span>
                <Link href={`/dashboard/tools/${tool.id}`} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">Open</Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {trendingTools.map((tool) => (
          <Card key={`trend-${tool.id}`} className="premium-surface border-rose-200/70 bg-gradient-to-br from-rose-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Flame size={15} className="text-rose-500" /> {tool.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">{getBenefit(tool.description)}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">{tool.creditCost} credits</p>
                <Link href={`/dashboard/tools/${tool.id}`} className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800">Open</Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {favoriteTools.slice(0, 3).map((tool) => (
          <Card key={`fav-${tool!.id}`} className="premium-surface border-amber-200 bg-amber-50/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Star size={15} className="text-amber-500" /> {tool!.name}</CardTitle>
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
          <Card key={`recent-${tool!.id}`} className="premium-surface border-blue-200 bg-blue-50/40">
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
          <Card key={tool.id} className="premium-surface interactive-lift border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{tool.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">{getBenefit(tool.description)}</p>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${categoryTone(tool.category)}`}>{tool.category}</span>
                <span className="text-xs text-slate-500">{tool.creditCost} credits</span>
              </div>
              <div className="flex items-center justify-between">
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
