"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Clock3, Flame, Search, Sparkles, Star, TrendingUp, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listToolDefinitions } from "@/definitions";

const FAVORITES_KEY = "zenovee_tool_favorites";
const RECENTS_KEY = "zenovee_recent_tools";
const INITIAL_VISIBLE_TOOLS = 4;

const CATEGORY_COPY = {
  "Executive Branding": {
    description: "Build authority, sharpen positioning, and turn leadership ideas into high-trust brand assets.",
    accent: "from-violet-500/12 via-fuchsia-500/8 to-transparent",
    badge: "Authority systems",
  },
  "B2B Sales": {
    description: "Give revenue teams structured outbound, sharper objection handling, and higher-quality enterprise conversations.",
    accent: "from-sky-500/12 via-cyan-500/8 to-transparent",
    badge: "Revenue acceleration",
  },
  "Conversion Copywriting": {
    description: "Create persuasive messaging frameworks designed to lift response rates, clicks, and pipeline conversion.",
    accent: "from-amber-500/14 via-orange-500/8 to-transparent",
    badge: "Conversion stack",
  },
  "SEO & Authority": {
    description: "Organize content strategy, search intent, and topical coverage into an authority-building growth engine.",
    accent: "from-emerald-500/14 via-lime-500/8 to-transparent",
    badge: "Search growth",
  },
  "Premium Image/Brand Assets": {
    description: "Plan polished visuals, premium campaign assets, and consistent brand direction at enterprise quality.",
    accent: "from-rose-500/12 via-pink-500/8 to-transparent",
    badge: "Visual studio",
  },
} as const;

const CATEGORY_ORDER = Object.keys(CATEGORY_COPY) as Array<keyof typeof CATEGORY_COPY>;

type FilterMode = "all" | "favorites" | "recent";
type WorkspaceCategory = keyof typeof CATEGORY_COPY;

type WorkspaceTool = {
  id: string;
  name: string;
  description: string;
  creditCost: number;
  category: WorkspaceCategory;
  icon: string;
  featured: boolean;
  trending: boolean;
  estimatedTimeSeconds?: number;
  tags: string[];
};

function getBenefit(description: string) {
  const clean = description.trim();
  if (!clean) return "Premium system for faster, higher-quality execution.";
  return clean.length > 110 ? `${clean.slice(0, 110)}…` : clean;
}

function getCategoryTheme(category: WorkspaceCategory) {
  switch (category) {
    case "Executive Branding":
      return {
        label: "border-violet-200 bg-violet-50 text-violet-700",
        card: "border-violet-200/70 bg-gradient-to-br from-violet-50 via-white to-white",
        icon: "bg-violet-100 text-violet-700",
      };
    case "B2B Sales":
      return {
        label: "border-sky-200 bg-sky-50 text-sky-700",
        card: "border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-white",
        icon: "bg-sky-100 text-sky-700",
      };
    case "Conversion Copywriting":
      return {
        label: "border-amber-200 bg-amber-50 text-amber-700",
        card: "border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-white",
        icon: "bg-amber-100 text-amber-700",
      };
    case "SEO & Authority":
      return {
        label: "border-emerald-200 bg-emerald-50 text-emerald-700",
        card: "border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-white",
        icon: "bg-emerald-100 text-emerald-700",
      };
    case "Premium Image/Brand Assets":
      return {
        label: "border-rose-200 bg-rose-50 text-rose-700",
        card: "border-rose-200/70 bg-gradient-to-br from-rose-50 via-white to-white",
        icon: "bg-rose-100 text-rose-700",
      };
  }
}

function ToolCard({
  tool,
  isFavorite,
  onToggleFavorite,
}: {
  tool: WorkspaceTool;
  isFavorite: boolean;
  onToggleFavorite: (toolId: string) => void;
}) {
  const theme = getCategoryTheme(tool.category);

  return (
    <Card className={`premium-surface interactive-lift overflow-hidden ${theme.card}`}>
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`flex size-11 items-center justify-center rounded-2xl text-lg shadow-sm ${theme.icon}`}>
              <span aria-hidden="true">{tool.icon}</span>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base md:text-lg">{tool.name}</CardTitle>
                <span className="rounded-full border border-slate-200 bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
                  Premium
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className={`rounded-full border px-2.5 py-1 font-semibold ${theme.label}`}>{tool.category}</span>
                {tool.featured ? <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 font-semibold text-violet-700">Featured</span> : null}
                {tool.trending ? <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-semibold text-rose-700">Trending</span> : null}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleFavorite(tool.id)}
            aria-label={isFavorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
            className={`rounded-xl border px-2.5 py-2 text-sm transition ${
              isFavorite
                ? "border-amber-200 bg-amber-50 text-amber-600"
                : "border-slate-200 bg-white/90 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {isFavorite ? "★" : "☆"}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-slate-600">{getBenefit(tool.description)}</p>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Credits</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{tool.creditCost} per run</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Value</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {tool.estimatedTimeSeconds ? `~${tool.estimatedTimeSeconds}s output` : "Fast premium output"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Enterprise-grade workflow assistant</p>
          <Button asChild size="sm">
            <Link href={`/dashboard/tools/${tool.id}`}>Open Tool</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SpotlightRail({
  title,
  description,
  icon,
  tools,
  emptyMessage,
  favoriteIds,
  onToggleFavorite,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  tools: WorkspaceTool[];
  emptyMessage: string;
  favoriteIds: string[];
  onToggleFavorite: (toolId: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            {icon}
            <span>{title}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="stat-chip">{tools.length} tools</span>
      </div>

      {tools.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={`${title}-${tool.id}`} tool={tool} isFavorite={favoriteIds.includes(tool.id)} onToggleFavorite={onToggleFavorite} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-slate-200 bg-white/70">
          <CardContent className="p-6 text-sm text-muted-foreground">{emptyMessage}</CardContent>
        </Card>
      )}
    </section>
  );
}

export function ToolsWorkspace() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CATEGORY_ORDER.map((category, index) => [category, index < 2]))
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const parsedFavorites = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]");
      setFavoriteIds(Array.isArray(parsedFavorites) ? parsedFavorites : []);
    } catch {
      setFavoriteIds([]);
    }

    try {
      const parsedRecents = JSON.parse(window.localStorage.getItem(RECENTS_KEY) ?? "[]");
      setRecentIds(Array.isArray(parsedRecents) ? parsedRecents : []);
    } catch {
      setRecentIds([]);
    }
  }, []);

  const tools = useMemo<WorkspaceTool[]>(
    () =>
      listToolDefinitions()
        .filter((tool) => tool.metadata.availability === "active" && (tool.metadata.visibility ?? "public") === "public")
        .filter((tool): tool is typeof tool & { metadata: typeof tool.metadata & { category: WorkspaceCategory } } => tool.metadata.category in CATEGORY_COPY)
        .map((tool) => ({
          id: tool.id,
          name: tool.metadata.name,
          description: tool.metadata.description,
          creditCost: tool.creditCost,
          category: tool.metadata.category,
          icon: tool.metadata.icon || "✨",
          featured: Boolean(tool.metadata.featured),
          trending: Boolean(tool.metadata.trending),
          estimatedTimeSeconds: tool.metadata.estimatedTimeSeconds,
          tags: tool.metadata.tags ?? [],
        })),
    []
  );

  const toolMap = useMemo(() => new Map(tools.map((tool) => [tool.id, tool])), [tools]);
  const recentTools = useMemo(() => recentIds.map((id) => toolMap.get(id)).filter((tool): tool is WorkspaceTool => Boolean(tool)), [recentIds, toolMap]);
  const favoriteTools = useMemo(() => favoriteIds.map((id) => toolMap.get(id)).filter((tool): tool is WorkspaceTool => Boolean(tool)), [favoriteIds, toolMap]);

  const mostUsedTools = useMemo(() => {
    const recencyScore = new Map<string, number>();
    recentIds.forEach((id, index) => {
      recencyScore.set(id, 12 - index);
    });

    return [...tools]
      .map((tool) => ({
        tool,
        score:
          (tool.featured ? 3 : 0) +
          (tool.trending ? 2 : 0) +
          (favoriteIds.includes(tool.id) ? 4 : 0) +
          (recencyScore.get(tool.id) ?? 0),
      }))
      .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
      .slice(0, 6)
      .map(({ tool }) => tool);
  }, [tools, favoriteIds, recentIds]);

  const featuredTools = useMemo(() => tools.filter((tool) => tool.featured).slice(0, 6), [tools]);
  const trendingTools = useMemo(() => tools.filter((tool) => tool.trending).slice(0, 6), [tools]);
  const categories = useMemo(() => ["All", ...CATEGORY_ORDER.filter((category) => tools.some((tool) => tool.category === category))], [tools]);

  const filteredTools = useMemo(() => {
    const q = query.toLowerCase().trim();

    return tools.filter((tool) => {
      const passCategory = activeCategory === "All" || tool.category === activeCategory;
      const passMode =
        filterMode === "all" ||
        (filterMode === "favorites" && favoriteIds.includes(tool.id)) ||
        (filterMode === "recent" && recentIds.includes(tool.id));
      const haystack = `${tool.name} ${tool.description} ${tool.category} ${tool.tags.join(" ")}`.toLowerCase();
      const passQuery = !q || haystack.includes(q);

      return passCategory && passMode && passQuery;
    });
  }, [tools, query, activeCategory, filterMode, favoriteIds, recentIds]);

  const groupedCategories = useMemo(
    () => CATEGORY_ORDER.map((category) => ({ category, tools: filteredTools.filter((tool) => tool.category === category) })).filter((group) => group.tools.length > 0),
    [filteredTools]
  );

  const toggleFavorite = (id: string) => {
    const next = favoriteIds.includes(id) ? favoriteIds.filter((value) => value !== id) : [id, ...favoriteIds].slice(0, 24);
    setFavoriteIds(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div className="space-y-8">
      <section className="premium-surface-elevated overflow-hidden p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">
              <Sparkles className="size-3.5" />
              Tool Operating System
            </div>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Calm, category-driven AI workflows for enterprise execution.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                Discover premium tools by business function, surface the systems that matter most, and expand categories only when you need them.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Workspace tools</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{tools.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Categories</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{categories.length - 1}</p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Saved favorites</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{favoriteIds.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools by workflow, outcome, or category" className="h-12 border-slate-200 bg-white pl-10" />
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          {([
            { id: "all", label: "All tools" },
            { id: "favorites", label: "Favorites" },
            { id: "recent", label: "Recent" },
          ] as const).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilterMode(item.id)}
              className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${
                filterMode === item.id
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${
              activeCategory === category
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-violet-200/80 bg-gradient-to-br from-violet-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-violet-500">Discovery mode</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">Progressive</p>
              </div>
              <Wand2 className="size-5 text-violet-500" />
            </div>
            <p className="mt-3 text-sm text-slate-600">Expand only the categories you want instead of scanning a noisy all-tools wall.</p>
          </CardContent>
        </Card>

        <Card className="border-sky-200/80 bg-gradient-to-br from-sky-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-sky-500">Featured tools</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{featuredTools.length}</p>
              </div>
              <Sparkles className="size-5 text-sky-500" />
            </div>
            <p className="mt-3 text-sm text-slate-600">Curated premium systems surfaced first for faster workspace orientation.</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-500">Favorites ready</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{favoriteTools.length}</p>
              </div>
              <Star className="size-5 text-amber-500" />
            </div>
            <p className="mt-3 text-sm text-slate-600">Pin your highest-value systems for one-click access across busy sessions.</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Recent context</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{recentTools.length}</p>
              </div>
              <Clock3 className="size-5 text-emerald-500" />
            </div>
            <p className="mt-3 text-sm text-slate-600">Resume momentum quickly with recently used tools brought back to the top.</p>
          </CardContent>
        </Card>
      </div>

      <SpotlightRail
        title="Featured tools"
        description="Best entry points into the Zenovee workspace for premium, high-confidence execution."
        icon={<Sparkles className="size-4 text-violet-500" />}
        tools={featuredTools}
        emptyMessage="No featured tools match your current filters. Try broadening search or switching back to all tools."
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
      />

      <SpotlightRail
        title="Most-used tools"
        description="Smartly prioritized from recent activity, favorites, and premium prominence signals."
        icon={<TrendingUp className="size-4 text-sky-500" />}
        tools={mostUsedTools}
        emptyMessage="Most-used tools will appear here as your workspace activity grows."
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
      />

      <SpotlightRail
        title="Recently used tools"
        description="Jump back into the exact systems you used most recently without rescanning the directory."
        icon={<Clock3 className="size-4 text-emerald-500" />}
        tools={recentTools.slice(0, 6)}
        emptyMessage="Your recently used tools will appear here after you run tools from the workspace."
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
      />

      <SpotlightRail
        title="Trending tools"
        description="High-attention systems that are especially useful for current workspace demand."
        icon={<Flame className="size-4 text-rose-500" />}
        tools={trendingTools}
        emptyMessage="No trending tools match the current filter set."
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
      />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="premium-label">Category explorer</p>
            <h2 className="text-2xl font-semibold tracking-tight">Structured tool discovery</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse tools by business function with collapsible sections designed to reduce cognitive overload.
            </p>
          </div>
          <span className="stat-chip">{filteredTools.length} results</span>
        </div>

        {groupedCategories.length === 0 ? (
          <Card className="border-dashed border-slate-200 bg-white/70">
            <CardContent className="p-8 text-sm text-muted-foreground">
              No tools match your current search and filters. Try another category, clear the search, or switch back to all tools.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groupedCategories.map(({ category, tools: categoryTools }) => {
              const meta = CATEGORY_COPY[category];
              const expanded = expandedCategories[category] ?? false;
              const visibleTools = expanded ? categoryTools : categoryTools.slice(0, INITIAL_VISIBLE_TOOLS);
              const hiddenCount = Math.max(categoryTools.length - visibleTools.length, 0);

              return (
                <Card key={category} className="overflow-hidden border-slate-200 bg-white/90">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="w-full text-left transition hover:bg-slate-50/80"
                  >
                    <CardHeader className={`relative gap-4 overflow-hidden bg-gradient-to-r ${meta.accent}`}>
                      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-slate-200 bg-white/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                              {meta.badge}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                              {categoryTools.length} tools
                            </span>
                          </div>
                          <div>
                            <CardTitle className="text-xl md:text-2xl">{category}</CardTitle>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{meta.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-start md:self-center">
                          <span className="text-xs font-medium text-slate-500">{expanded ? "Collapse" : "Expand"}</span>
                          <span className={`rounded-full border border-slate-200 bg-white/90 p-2 text-slate-600 transition ${expanded ? "rotate-180" : "rotate-0"}`}>
                            <ChevronDown className="size-4" />
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  <CardContent className="space-y-5 p-5 md:p-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {visibleTools.map((tool) => (
                        <ToolCard key={tool.id} tool={tool} isFavorite={favoriteIds.includes(tool.id)} onToggleFavorite={toggleFavorite} />
                      ))}
                    </div>

                    {!expanded && hiddenCount > 0 ? (
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-sm text-slate-600">{hiddenCount} more tools are available in this category.</p>
                        <Button variant="outline" size="sm" onClick={() => toggleCategory(category)}>
                          Show all
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
