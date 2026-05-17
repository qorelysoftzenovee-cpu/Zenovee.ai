import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { comparisonPages, getToolsBySlugs } from "@/lib/seo/content";
import { createMetadata } from "@/lib/seo/site";

export async function generateStaticParams() {
  return comparisonPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = comparisonPages.find((item) => item.slug === slug);
  if (!page) return {};
  return createMetadata({ title: page.title, description: page.description, path: `/compare/${page.slug}` });
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = comparisonPages.find((item) => item.slug === slug);
  if (!page) notFound();
  const tools = getToolsBySlugs(page.toolSlugs);

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={false} />
      <main className="section-shell py-16 md:py-20 space-y-8">
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
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{tool.heroDescription}</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {tool.featurePoints.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Link href={`/tools/${tool.slug}`} className="text-sm font-medium text-accent">
                  View details
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