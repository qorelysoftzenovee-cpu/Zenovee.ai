"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock3, Compass, Filter, Flame, Search, Sparkles, Star, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ToolSeoItem = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: string;
  icon: string;
  tagline: string;
  tags: string[];
  featured: boolean;
  trending: boolean;
  estimatedTimeSeconds?: number;
  heroDescription: string;
  primaryKeyword: string;
  featurePoints: string[];
  useCases: string[];
  industries: string[];
};

const RECENT_TOOLS_STORAGE_KEY = "zenovee_recent_tools";

function formatEta(seconds?: number) {
  if (!seconds) return "~1 min";
  if (seconds < 60) return `~${seconds}s`;
  return `~${Math.round(seconds / 60)} min`;
}

export function PublicToolsDirectory({ tools }: { tools: ToolSeoItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [recentSlugs, setRecentSlugs] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const raw = window.localStorage.getItem(RECENT_TOOLS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  });

  const categories = useMemo(() => {
    const ordered = ["All", "SEO", "Marketing", "Copywriting", "Social Media", "SaaS", "Productivity", "Research", "Browser Tools"];
    const live = Array.from(new Set(tools.map((tool) => tool.category)));
    return ordered.filter((item) => item === "All" || live.includes(item));
  }, [tools]);

  const featured = useMemo(() => {
    const explicit = tools.filter((tool) => tool.featured);
    return (explicit.length ? explicit : tools).slice(0, 3);
  }, [tools]);

  const trending = useMemo(() => {
    const explicit = tools.filter((tool) => tool.trending);
    return (explicit.length ? explicit : tools).slice(0, 5);
  }, [tools]);

  const recentlyExplored = useMemo(() => {
    const mapped = recentSlugs
      .map((slug) => tools.find((tool) => tool.slug === slug))
      .filter((tool): tool is ToolSeoItem => Boolean(tool));

    if (mapped.length > 0) return mapped.slice(0, 4);
    return tools.slice(0, 4);
  }, [recentSlugs, tools]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return tools.filter((tool) => {
      const categoryMatch = category === "All" || tool.category === category;
      const searchPool = [
        tool.name,
        tool.shortName,
        tool.description,
        tool.tagline,
        tool.heroDescription,
        tool.primaryKeyword,
        ...tool.tags,
        ...tool.useCases,
        ...tool.industries,
      ]
        .join(" ")
        .toLowerCase();

      const searchMatch = q.length === 0 || searchPool.includes(q);
      return categoryMatch && searchMatch;
    });
  }, [tools, query, category]);

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        categories.map((item) => [item, item === "All" ? tools.length : tools.filter((tool) => tool.category === item).length])
      ),
    [categories, tools]
  );

  const spotlightTool = filtered[0] ?? featured[0] ?? tools[0];

  const handleOpenTool = (slug: string) => {
    if (typeof window === "undefined") return;

    const next = [slug, ...recentSlugs.filter((item) => item !== slug)].slice(0, 6);
    setRecentSlugs(next);
    window.localStorage.setItem(RECENT_TOOLS_STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="hero-panel page-glow overflow-hidden p-6 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
          <div className="space-y-5">
            <div className="premium-label">Premium tools workspace</div>
            <div className="space-y-3">
              <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl xl:text-5xl">
                Explore premium AI workflows built to feel like software, not prompt boxes.
              </h2>
              <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
                Browse featured tools, discover what’s trending, and jump into polished AI workflows for SEO, marketing, copy, research,
                and browser-side productivity.
              </p>
            </div>

            <div className="relative max-w-3xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by workflow, category, output type, keyword, or use case"
                className="h-[52px] rounded-2xl border-white/10 bg-black/10 pl-11 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {["SEO articles", "Ad campaigns", "Landing pages", "Audience research", "Browser tools"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuery(item)}
                  className="stat-chip transition hover:border-white/20 hover:bg-white/10 hover:text-foreground"
                >
                  <Sparkles size={12} className="text-accent" />
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            {[
              ["Active tools", String(tools.length), "Curated AI workflows"],
              ["Live categories", String(categories.length - 1), "Organized discovery"],
              ["Trending now", String(trending.length), "High-intent favorites"],
              ["Matches", String(filtered.length), category === "All" ? "Across the platform" : `Inside ${category}`],
            ].map(([label, value, meta]) => (
              <div key={label} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{meta}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`rounded-full border px-4 py-2 text-sm transition-all ${
              item === category
                ? "border-primary/50 bg-primary/15 text-foreground shadow-[0_10px_40px_-24px_rgba(99,102,241,0.7)]"
                : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:bg-white/[0.06] hover:text-foreground"
            }`}
          >
            {item}
            <span className="ml-2 text-xs text-muted-foreground">{categoryCounts[item]}</span>
          </button>
        ))}
      </div>

      {featured.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="premium-label">Featured tools</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">Premium workflows worth opening first</h3>
            </div>
            <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
              <Star size={16} className="text-amber-300" />
              Editor-selected experiences
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {featured.map((tool, index) => (
              <Card
                key={tool.slug}
                className={`interactive-card overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] ${
                  index === 0 ? "xl:col-span-2" : ""
                }`}
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-2xl">
                        {tool.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.category}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      {index === 0 ? "Flagship" : "Featured"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <CardTitle className="text-2xl md:text-3xl">{tool.tagline}</CardTitle>
                    <p className="text-sm leading-6 text-muted-foreground">{tool.heroDescription}</p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    {tool.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">ETA</p>
                      <p className="mt-2 text-sm font-medium">{formatEta(tool.estimatedTimeSeconds)}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Use case</p>
                      <p className="mt-2 text-sm font-medium">{tool.useCases[0] ?? tool.category}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Best for</p>
                      <p className="mt-2 text-sm font-medium">{tool.industries[0] ?? "Growth teams"}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link href={`/tools/${tool.slug}`} onClick={() => handleOpenTool(tool.slug)}>
                        Explore tool
                        <ArrowUpRight size={16} />
                      </Link>
                    </Button>
                    <Button variant="secondary" onClick={() => setQuery(tool.primaryKeyword)}>
                      Refine search
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <div className="surface-card p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
              <Flame size={16} className="text-accent" /> Trending now
            </div>
            <div className="space-y-2">
              {trending.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  onClick={() => handleOpenTool(tool.slug)}
                  className="block rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 transition hover:border-white/15 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{tool.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{tool.category} • {formatEta(tool.estimatedTimeSeconds)}</p>
                    </div>
                    <ArrowUpRight size={14} className="mt-0.5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="surface-card p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
              <Compass size={16} className="text-accent" /> Recently explored
            </div>
            <div className="space-y-2">
              {recentlyExplored.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  onClick={() => handleOpenTool(tool.slug)}
                  className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-white/[0.05] hover:text-foreground"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span>{tool.icon}</span>
                    <span className="truncate">{tool.shortName}</span>
                  </span>
                  <ArrowUpRight size={14} />
                </Link>
              ))}
            </div>
          </div>

          {spotlightTool ? (
            <div className="surface-card p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
                <Wand2 size={16} className="text-accent" /> Spotlight
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-medium">{spotlightTool.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{spotlightTool.tagline}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="stat-chip">
                    <Clock3 size={12} className="text-accent" /> {formatEta(spotlightTool.estimatedTimeSeconds)}
                  </span>
                  <span className="stat-chip">
                    <Filter size={12} className="text-accent" /> {spotlightTool.category}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </aside>

        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles size={16} className="text-accent" />
            <span>
              Showing {filtered.length} premium tools{category !== "All" ? ` in ${category}` : ""}
              {query ? ` for “${query}”` : ""}.
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((tool, index) => (
              <Card
                key={tool.slug}
                className={`interactive-card h-full overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] ${
                  index === 0 && filtered.length > 2 ? "md:col-span-2" : ""
                }`}
              >
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl">
                        {tool.icon}
                      </div>
                      <div>
                        <CardTitle>{tool.name}</CardTitle>
                        <p className="mt-2 text-sm text-muted-foreground">{tool.tagline}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        {tool.category}
                      </span>
                      {tool.trending ? <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary">Trending</span> : null}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  <p className="text-sm leading-6 text-muted-foreground">{tool.heroDescription}</p>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {tool.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 px-3 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Primary workflow</p>
                      <p className="mt-2 text-sm font-medium">{tool.useCases[0] ?? tool.primaryKeyword}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Generation time</p>
                      <p className="mt-2 text-sm font-medium">{formatEta(tool.estimatedTimeSeconds)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">Premium outputs with clearer structure, faster execution, and better presentation.</p>
                    <Button asChild>
                      <Link href={`/tools/${tool.slug}`} onClick={() => handleOpenTool(tool.slug)}>
                        Open tool
                        <ArrowUpRight size={16} />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="surface-muted px-6 py-10 text-center">
          <p className="text-lg font-semibold">No tools match that search yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a broader keyword like SEO, landing page, ads, research, or browser tools to rediscover the workspace.
          </p>
        </div>
      ) : null}
    </div>
  );
}
