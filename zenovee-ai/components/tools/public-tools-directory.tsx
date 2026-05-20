import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ToolSeoItem = {
  slug: string;
  name: string;
  category: string;
  icon?: string;
  heroDescription: string;
};

const creditCostBySlug: Record<string, number> = {
  "seo-article-generator": 10,
  "ad-copy-generator": 2,
  "customer-persona-builder": 5,
  "landing-page-copy-generator": 6,
};

export function PublicToolsDirectory({ tools }: { tools: ToolSeoItem[] }) {
  return (
    <div className="space-y-4">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Launch tools</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {tools.map((tool) => (
            <Card key={tool.slug} className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{tool.icon ?? "✨"}</span>
                  {tool.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{tool.heroDescription}</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">{creditCostBySlug[tool.slug] ?? 0} credits</span>
                  <Button asChild>
                    <Link href={`/tools/${tool.slug}`}>Open Tool</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
