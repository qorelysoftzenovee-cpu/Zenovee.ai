import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { getToolsBySlugs, useCasePages } from "@/lib/seo/content";
import { createMetadata } from "@/lib/seo/site";

export async function generateStaticParams() {
  return useCasePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = useCasePages.find((item) => item.slug === slug);
  if (!page) return {};
  return createMetadata({ title: page.title, description: page.description, path: `/use-cases/${page.slug}` });
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = useCasePages.find((item) => item.slug === slug);
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
        <div className="grid gap-4">
          {tools.map((tool) => (
            <Card key={tool.slug}>
              <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-sm text-muted-foreground">{tool.heroDescription}</p>
                </div>
                <Link href={`/tools/${tool.slug}`} className="text-sm font-medium text-accent">
                  Explore tool
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