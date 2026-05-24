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
};

export function PublicToolsDirectory({ tools }: { tools: ToolSeoItem[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

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

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, ToolSeoItem[]>>((acc, tool) => {
      acc[tool.category] = acc[tool.category] ?? [];
      acc[tool.category].push(tool);
      return acc;
    }, {});
  }, [filtered]);

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
              <span className="rounded-full border px-2 py-1">{tool.category}</span>
              <span className="rounded-full border px-2 py-1">{tool.creditCost ?? 0} credits</span>
            </div>
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
        <Input placeholder="Search premium tools" value={query} onChange={(e) => setQuery(e.target.value)} />
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
        <h2 className="text-xl font-semibold tracking-tight">All premium tools</h2>
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category} className="space-y-3">
              <h3 className="text-lg font-semibold">{category}</h3>
              {renderCards(items)}
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
