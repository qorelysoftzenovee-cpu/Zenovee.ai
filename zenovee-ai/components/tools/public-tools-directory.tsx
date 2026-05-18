"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ToolSeoItem = {
  slug: string;
  name: string;
  heroDescription: string;
  category: string;
  primaryKeyword: string;
  icon: string;
};

export function PublicToolsDirectory({ tools }: { tools: ToolSeoItem[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => ["All", ...Array.from(new Set(tools.map((t) => t.category)))], [tools]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const categoryMatch = category === "All" || tool.category === category;
      const searchMatch =
        q.length === 0 ||
        tool.name.toLowerCase().includes(q) ||
        tool.heroDescription.toLowerCase().includes(q) ||
        tool.primaryKeyword.toLowerCase().includes(q);
      return categoryMatch && searchMatch;
    });
  }, [tools, query, category]);

  return (
    <div className="space-y-5">
      <div className="surface-card p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools"
            className="h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <Button
                key={item}
                size="sm"
                variant={item === category ? "default" : "outline"}
                onClick={() => setCategory(item)}
              >
                {item}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map((tool) => (
          <Card key={tool.slug} className="h-full">
            <CardHeader>
              <div className="text-3xl">{tool.icon}</div>
              <CardTitle>{tool.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{tool.heroDescription}</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border px-3 py-1 text-xs">{tool.category}</span>
                <span className="rounded-full border px-3 py-1 text-xs">Credit based</span>
              </div>
              <Button asChild>
                <Link href={`/tools/${tool.slug}`}>Open Tool</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="surface-muted px-5 py-8 text-center text-sm text-muted-foreground">
          No tools match your search.
        </div>
      ) : null}
    </div>
  );
}
