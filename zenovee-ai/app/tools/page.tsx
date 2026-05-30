import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import Navigation from "@/app/components/Navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { toolSeoPages } from "@/lib/seo/content";
import { createBreadcrumbSchema, createMetadata } from "@/lib/seo/site";
import { PublicToolsDirectory } from "@/components/tools/public-tools-directory";

export const metadata: Metadata = createMetadata({
  title: "Tools",
  description: "Explore 50 enterprise-grade AI tools across branding, sales, conversion, SEO, and brand assets.",
  path: "/tools",
  keywords: ["enterprise AI tools", "enterprise AI platform", "B2B sales AI", "SEO authority AI", "conversion copy AI"],
});

export default function ToolsDirectoryPage() {
  const tools = toolSeoPages;

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }])} />
      <Navigation isAuthenticated={false} />
      <main className="section-shell py-14 md:py-16">
        <div className="mb-8 max-w-3xl space-y-3">
          <p className="premium-label">Tools</p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Enterprise AI tools ecosystem</h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Discover all tools with category filters, featured picks, and trending systems.
          </p>
        </div>

        <PublicToolsDirectory tools={tools} />
      </main>
      <Footer />
    </div>
  );
}