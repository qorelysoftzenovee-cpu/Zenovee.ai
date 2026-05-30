"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ToolSeoItem = {
  slug: string;
  name: string;
  category: string;
  icon?: string;
  heroDescription: string;
  featured?: boolean;
  trending?: boolean;
  creditCost?: number;
  premiumBadge?: string;
  recommended?: boolean;
  complexity?: "light" | "medium" | "heavy";
  expectedOutputValue?: string;
  creditTooltip?: string;
};

const ALLOWED_BADGES = new Set(["new", "most popular", "recommended"]);

function resolveToolBadge(tool: ToolSeoItem): string | null {
  const badge = tool.premiumBadge?.trim();
  if (badge && ALLOWED_BADGES.has(badge.toLowerCase())) return badge;
  if (tool.featured) return "Most Popular";
  if (tool.trending) return "New";
  if (tool.recommended) return "Recommended";
  return null;
}

export function PublicToolsDirectory({ tools }: { tools: ToolSeoItem[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const categories = useMemo(() => ["All", ...Array.from(new Set(tools.map((tool) => tool.category)))], [tools]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const passCategory = activeCategory === "All" || tool.category === activeCategory;
      const hay = `${tool.name} ${tool.heroDescription} ${tool.category}`.toLowerCase();
      return passCategory && (!q || hay.includes(q));
    });
  }, [tools, query, activeCategory]);

  const featured = filtered.filter((tool) => tool.featured).slice(0, 8);
  const trending = filtered.filter((tool) => tool.trending).slice(0, 8);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const renderCards = (items: ToolSeoItem[]) => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((tool) => (
        <Card key={tool.slug} className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span>{tool.icon ?? "✨"}</span>
              {tool.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{tool.heroDescription}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border px-2 py-1">Category: {tool.category}</span>
              <span className="rounded-full border px-2 py-1">Cost: {tool.creditCost ?? 0} credits</span>
              {tool.complexity ? <span className="rounded-full border px-2 py-1 uppercase">{tool.complexity}</span> : null}
              {resolveToolBadge(tool) ? <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-1 text-primary">{resolveToolBadge(tool)}</span> : null}
            </div>
            {tool.expectedOutputValue ? <p className="text-xs text-foreground/80">Estimated output: {tool.expectedOutputValue}</p> : null}
            {tool.creditTooltip ? <p className="text-xs text-muted-foreground">{tool.creditTooltip}</p> : null}
            <div className="flex items-center justify-end">
              <Button asChild>
                <Link href={`/tools/${tool.slug}`}>Open Tool</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Input placeholder="Search tools" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                activeCategory === category ? "bg-foreground text-background" : "bg-background"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {featured.length ? <section className="space-y-4"><h2 className="text-xl font-semibold tracking-tight">Featured tools</h2>{renderCards(featured)}</section> : null}
      {trending.length ? <section className="space-y-4"><h2 className="text-xl font-semibold tracking-tight">Trending tools</h2>{renderCards(trending)}</section> : null}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">All tools</h2>
        <div className="space-y-4">
          {renderCards(paginated)}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>Showing {paginated.length} of {filtered.length} tools</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
              <span>Page {page} / {totalPages}</span>
              <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
