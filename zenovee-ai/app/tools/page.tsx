import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import Navigation from "@/app/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonLd } from "@/components/seo/json-ld";
import { toolSeoPages } from "@/lib/seo/content";
import { createBreadcrumbSchema, createMetadata, SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = createMetadata({
  title: "AI Tools Platform",
  description: "Browse AI tools for SEO, marketing, personas, and landing page workflows with structured outputs and publishable results.",
  path: "/tools",
  keywords: ["AI tools platform", "AI SaaS tools", "AI marketing tools", "AI productivity tools"],
});

export default function ToolsDirectoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }])} />
      <Navigation isAuthenticated={false} />
      <main>
        <section className="section-shell py-16 md:py-24">
          <div className="max-w-3xl space-y-5">
            <p className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">AI tools directory</p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Discover AI tools built for SEO, growth, and productivity</h1>
            <p className="text-lg text-muted-foreground">
              Explore structured AI workflows from {SITE_NAME} for content, ad copy, audience research, and landing page production.
            </p>
          </div>
        </section>

        <section className="section-shell pb-20">
          <div className="grid gap-6 md:grid-cols-2">
            {toolSeoPages.map((tool) => (
              <Card key={tool.slug} className="h-full">
                <CardHeader>
                  <div className="text-3xl">{tool.icon}</div>
                  <CardTitle>{tool.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{tool.heroDescription}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border px-3 py-1 text-xs">{tool.category}</span>
                    <span className="rounded-full border px-3 py-1 text-xs">{tool.primaryKeyword}</span>
                  </div>
                  <Button asChild>
                    <Link href={`/tools/${tool.slug}`} data-analytics-event="conversion" data-analytics-label={`tool-directory-${tool.slug}`}>
                      View tool page
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}