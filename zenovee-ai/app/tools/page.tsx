import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import Navigation from "@/app/components/Navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { toolSeoPages } from "@/lib/seo/content";
import { createBreadcrumbSchema, createMetadata, SITE_NAME } from "@/lib/seo/site";
import { PublicToolsDirectory } from "@/components/tools/public-tools-directory";

export const metadata: Metadata = createMetadata({
  title: "Explore premium AI tools",
  description: "Browse Zenovee AI tools for SEO, landing pages, ad copy, audience research, and focused workflow execution.",
  path: "/tools",
  keywords: ["AI tools platform", "AI SaaS tools", "AI marketing tools", "AI productivity tools"],
});

export default function ToolsDirectoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }])} />
      <Navigation isAuthenticated={false} />
      <main>
        <section className="section-shell py-16 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="max-w-3xl space-y-5">
              <p className="premium-label">AI tools directory</p>
              <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
                Discover premium tools built for fast execution, not UI noise.
              </h1>
              <p className="text-base text-muted-foreground md:text-lg">
                Explore focused workflows from {SITE_NAME} for SEO, ad copy, personas, and landing pages with a cleaner browsing experience.
              </p>
            </div>

            <div className="surface-card p-5 md:p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Search", "Fast tool discovery"],
                  ["Filter", "Clear categories"],
                  ["Scan", "Shorter, cleaner cards"],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section-shell pb-20">
          <PublicToolsDirectory tools={toolSeoPages} />
        </section>
      </main>
      <Footer />
    </div>
  );
}