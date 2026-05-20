import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import Navigation from "@/app/components/Navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { toolSeoPages } from "@/lib/seo/content";
import { createBreadcrumbSchema, createMetadata } from "@/lib/seo/site";
import { PublicToolsDirectory } from "@/components/tools/public-tools-directory";

export const metadata: Metadata = createMetadata({
  title: "Tools",
  description: "Four premium AI tools for marketing and content execution.",
  path: "/tools",
  keywords: ["AI tools", "SEO", "ad copy", "persona", "landing page copy"],
});

export default function ToolsDirectoryPage() {
  const launchToolSlugs = new Set([
    "seo-article-generator",
    "ad-copy-generator",
    "customer-persona-builder",
    "landing-page-copy-generator",
  ]);

  const launchTools = toolSeoPages.filter((tool) => launchToolSlugs.has(tool.slug));

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }])} />
      <Navigation isAuthenticated={false} />
      <main className="section-shell py-14 md:py-16">
        <div className="mb-8 max-w-3xl space-y-3">
          <p className="premium-label">Tools</p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Focused AI tools</h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Use exactly what you need: SEO article generation, ad copy, personas, and landing page copy.
          </p>
        </div>

        <PublicToolsDirectory tools={launchTools} />
      </main>
      <Footer />
    </div>
  );
}