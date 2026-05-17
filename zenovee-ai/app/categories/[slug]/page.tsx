import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { getToolsBySlugs, toolCategoryPages } from "@/lib/seo/content";
import { createBreadcrumbSchema, createMetadata } from "@/lib/seo/site";

export async function generateStaticParams() {
  return toolCategoryPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = toolCategoryPages.find((item) => item.slug === slug);
  if (!page) return {};
  return createMetadata({ title: page.title, description: page.description, path: `/categories/${page.slug}` });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = toolCategoryPages.find((item) => item.slug === slug);
  if (!page) notFound();
  const tools = getToolsBySlugs(page.toolSlugs);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Categories", path: "/tools" }, { name: page.title, path: `/categories/${page.slug}` }])} />
      <Navigation isAuthenticated={false} />
      <main className="section-shell py-16 md:py-20 space-y-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Tools", href: "/tools" }, { label: page.title }]} />
        <div className="max-w-3xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight">{page.title}</h1>
          <p className="text-lg text-muted-foreground">{page.intro}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {tools.map((tool) => (
            <Card key={tool.slug}>
              <CardHeader>
                <CardTitle>{tool.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{tool.heroDescription}</p>
                <Link href={`/tools/${tool.slug}`} className="mt-4 inline-block text-sm font-medium text-accent">
                  View tool
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}