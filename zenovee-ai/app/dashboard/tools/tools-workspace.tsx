"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listToolDefinitions } from "@/definitions";

const FAVORITES_KEY = "zenovee_tool_favorites";
const RECENTS_KEY = "zenovee_recent_tools";
const TOOL_STORAGE_SYNC_EVENT = "zenovee-tool-storage-sync";
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
const WORKSPACE_CATEGORY_SET = new Set<WorkspaceCategory>(CATEGORY_ORDER);

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
  searchIndex: string;
};

const EMPTY_TOOL_IDS: string[] = [];
const STORAGE_SYNC_DEBUG = process.env.NODE_ENV === "development";

function logStorageSync(message: string, metadata?: Record<string, unknown>) {
  if (!STORAGE_SYNC_DEBUG) return;
  if (metadata) {
    console.debug(`[tools-workspace] ${message}`, metadata);
    return;
  }
  console.debug(`[tools-workspace] ${message}`);
}

function arraysAreEqual(a: string[], b: string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function parseStoredToolIds(raw: string | null) {
  if (!raw) return EMPTY_TOOL_IDS;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : EMPTY_TOOL_IDS;
  } catch {
    return EMPTY_TOOL_IDS;
  }
}

function readStoredToolIds(storageKey: string) {
  if (typeof window === "undefined") return EMPTY_TOOL_IDS;
  return parseStoredToolIds(window.localStorage.getItem(storageKey));
}

function sanitizeToolIds(ids: string[], validIds: Set<string>) {
  if (!ids.length) return EMPTY_TOOL_IDS;
  const deduped = new Set<string>();
  for (const id of ids) {
    if (validIds.has(id)) deduped.add(id);
  }
  return Array.from(deduped);
}

function writeStoredToolIds(storageKey: string, value: string[], source?: string) {
  if (typeof window === "undefined") return;

  const raw = JSON.stringify(value);
  const existingRaw = window.localStorage.getItem(storageKey);

  if (existingRaw === raw) {
    logStorageSync("storage write skipped because values equal", { storageKey, source, size: value.length });
    return;
  }

  logStorageSync("storage write", { storageKey, source, size: value.length });
  window.localStorage.setItem(storageKey, raw);
  window.dispatchEvent(new CustomEvent(TOOL_STORAGE_SYNC_EVENT, { detail: { key: storageKey, source } }));
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);

  return debouncedValue;
}

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function buildSearchIndex(tool: {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
}) {
  return normalizeSearchValue([tool.id.replace(/-/g, " "), tool.name, tool.description, tool.category, ...tool.tags].join(" "));
}

function getSearchScore(tool: WorkspaceTool, tokens: string[]) {
  if (!tokens.length) return 0;

  return tokens.reduce((score, token) => {
    if (tool.name.toLowerCase().includes(token)) score += 6;
    if (tool.category.toLowerCase().includes(token)) score += 4;
    if (tool.tags.some((tag) => tag.toLowerCase().includes(token))) score += 3;
    if (tool.description.toLowerCase().includes(token)) score += 2;
    if (tool.id.replace(/-/g, " ").toLowerCase().includes(token)) score += 2;
    return score;
  }, 0);
}

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

export function ToolsWorkspace() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 180);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [favoriteIds, setFavoriteIds] = useState<string[]>(EMPTY_TOOL_IDS);
  const [recentIds, setRecentIds] = useState<string[]>(EMPTY_TOOL_IDS);
  const favoritesRef = useRef<string[]>(EMPTY_TOOL_IDS);
  const recentsRef = useRef<string[]>(EMPTY_TOOL_IDS);
  const syncSourceRef = useRef("tools-workspace");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CATEGORY_ORDER.map((category, index) => [category, index < 2]))
  );

  const tools = useMemo<WorkspaceTool[]>(
    () =>
      listToolDefinitions()
        .filter((tool) => tool.metadata.availability === "active" && (tool.metadata.visibility ?? "public") === "public")
        .filter((tool): tool is typeof tool & { metadata: typeof tool.metadata & { category: WorkspaceCategory } } =>
          WORKSPACE_CATEGORY_SET.has(tool.metadata.category as WorkspaceCategory)
        )
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
          searchIndex: buildSearchIndex({
            id: tool.id,
            name: tool.metadata.name,
            description: tool.metadata.description,
            category: tool.metadata.category,
            tags: tool.metadata.tags ?? [],
          }),
        })),
    []
  );

  const validToolIdSet = useMemo(() => new Set(tools.map((tool) => tool.id)), [tools]);

  useEffect(() => {
    favoritesRef.current = favoriteIds;
  }, [favoriteIds]);

  useEffect(() => {
    recentsRef.current = recentIds;
  }, [recentIds]);

  useEffect(() => {
    const syncFromStorage = () => {
      const nextFavorites = sanitizeToolIds(readStoredToolIds(FAVORITES_KEY), validToolIdSet);
      const nextRecents = sanitizeToolIds(readStoredToolIds(RECENTS_KEY), validToolIdSet);
      const favoritesChanged = !arraysAreEqual(nextFavorites, favoritesRef.current);
      const recentsChanged = !arraysAreEqual(nextRecents, recentsRef.current);

      logStorageSync("storage sync received", {
        favoritesChanged,
        recentsChanged,
        nextFavoritesSize: nextFavorites.length,
        nextRecentsSize: nextRecents.length,
      });

      if (!favoritesChanged && !recentsChanged) {
        logStorageSync("sync skipped because values equal");
        return;
      }

      startTransition(() => {
        if (favoritesChanged) {
          favoritesRef.current = nextFavorites;
          logStorageSync("favorites changed", { size: nextFavorites.length });
          setFavoriteIds(nextFavorites);
        }
        if (recentsChanged) {
          recentsRef.current = nextRecents;
          logStorageSync("recents changed", { size: nextRecents.length });
          setRecentIds(nextRecents);
        }
      });
    };

    syncFromStorage();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === FAVORITES_KEY || event.key === RECENTS_KEY) {
        syncFromStorage();
      }
    };

    const handleLocalSync = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string; source?: string }>;
      const key = customEvent.detail?.key;
      const source = customEvent.detail?.source;

      if (source && source === syncSourceRef.current) {
        logStorageSync("local sync ignored (same source)", { key, source });
        return;
      }

      if (!key || key === FAVORITES_KEY || key === RECENTS_KEY) {
        syncFromStorage();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(TOOL_STORAGE_SYNC_EVENT, handleLocalSync);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(TOOL_STORAGE_SYNC_EVENT, handleLocalSync);
    };
  }, [validToolIdSet]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingTarget = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !isTypingTarget) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === "Escape" && document.activeElement === searchInputRef.current) {
        if (query) {
          setQuery("");
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [query]);

  const toolMap = useMemo(() => new Map(tools.map((tool) => [tool.id, tool])), [tools]);
  const favoriteTools = useMemo(() => favoriteIds.map((id) => toolMap.get(id)).filter((tool): tool is WorkspaceTool => Boolean(tool)), [favoriteIds, toolMap]);
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const recentIdSet = useMemo(() => new Set(recentIds), [recentIds]);

  const categories = useMemo(() => ["All", ...CATEGORY_ORDER.filter((category) => tools.some((tool) => tool.category === category))], [tools]);
  const effectiveActiveCategory = categories.includes(activeCategory) ? activeCategory : "All";
  const normalizedQuery = useMemo(() => normalizeSearchValue(debouncedQuery), [debouncedQuery]);
  const queryTokens = useMemo(() => normalizedQuery.split(" ").filter(Boolean), [normalizedQuery]);
  const isSearchActive = queryTokens.length > 0 || effectiveActiveCategory !== "All" || filterMode !== "all";

  const filteredTools = useMemo(() => {
    return tools
      .filter((tool) => {
        const passCategory = effectiveActiveCategory === "All" || tool.category === effectiveActiveCategory;
        const passMode =
          filterMode === "all" ||
          (filterMode === "favorites" && favoriteIdSet.has(tool.id)) ||
          (filterMode === "recent" && recentIdSet.has(tool.id));
        const passQuery = !queryTokens.length || queryTokens.every((token) => tool.searchIndex.includes(token));

        return passCategory && passMode && passQuery;
      })
      .sort((a, b) => {
        const scoreDiff = getSearchScore(b, queryTokens) - getSearchScore(a, queryTokens);
        if (scoreDiff !== 0) return scoreDiff;
        if (a.featured !== b.featured) return Number(b.featured) - Number(a.featured);
        if (a.trending !== b.trending) return Number(b.trending) - Number(a.trending);
        return a.name.localeCompare(b.name);
      });
  }, [tools, effectiveActiveCategory, filterMode, favoriteIdSet, recentIdSet, queryTokens]);

  const groupedCategories = useMemo(
    () => CATEGORY_ORDER.map((category) => ({ category, tools: filteredTools.filter((tool) => tool.category === category) })).filter((group) => group.tools.length > 0),
    [filteredTools]
  );
  const isCategoryFocused = effectiveActiveCategory !== "All";

  const toggleFavorite = useCallback((id: string) => {
    if (!validToolIdSet.has(id)) return;
    const currentFavorites = favoritesRef.current;
    const next = currentFavorites.includes(id)
      ? currentFavorites.filter((value) => value !== id)
      : [id, ...currentFavorites].slice(0, 24);

    if (arraysAreEqual(next, currentFavorites)) {
      logStorageSync("favorites toggle skipped because values equal", { id });
      return;
    }

    favoritesRef.current = next;
    startTransition(() => {
      setFavoriteIds(next);
    });
    writeStoredToolIds(FAVORITES_KEY, next, syncSourceRef.current);
  }, [validToolIdSet]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  }, []);

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
          <Input
            ref={searchInputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools by name, category, keyword, tag, or description"
            aria-label="Search tools explorer"
            className="h-12 border-slate-200 bg-white pl-10 pr-20"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            /
          </span>
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
              effectiveActiveCategory === category
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {!isCategoryFocused ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          <Card className="border-violet-200/80 bg-gradient-to-br from-violet-50 to-white">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Workspace tools</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{tools.length}</p>
            </CardContent>
          </Card>

          <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Saved favorites</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{favoriteTools.length}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {isSearchActive ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="premium-label">Search results</p>
              <h2 className="text-2xl font-semibold tracking-tight">Instant filtered tool matches</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Results update as you type and match tool names, categories, keywords, tags, descriptions, and tool identifiers.
              </p>
            </div>
            <span className="stat-chip">{filteredTools.length} matches</span>
          </div>

          {filteredTools.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredTools.slice(0, 12).map((tool) => (
                <ToolCard key={`search-${tool.id}`} tool={tool} isFavorite={favoriteIds.includes(tool.id)} onToggleFavorite={toggleFavorite} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-slate-200 bg-white/70">
              <CardContent className="space-y-2 p-8 text-sm text-muted-foreground">
                <p className="font-medium text-slate-700">No tools matched your current search.</p>
                <p>Try a broader keyword, clear category filters, or switch back to all tools.</p>
              </CardContent>
            </Card>
          )}
        </section>
      ) : null}

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
