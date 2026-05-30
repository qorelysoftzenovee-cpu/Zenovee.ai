import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listToolDefinitions } from "@/definitions";

const CATEGORY_SLUGS = {
  "executive-branding": "Executive Branding",
  "b2b-sales": "B2B Sales",
  "conversion-copywriting": "Conversion Copywriting",
  "seo-authority": "SEO & Authority",
  "premium-image-brand-assets": "Premium Image/Brand Assets",
} as const;

type CategoryLabel = (typeof CATEGORY_SLUGS)[keyof typeof CATEGORY_SLUGS];

export async function generateStaticParams() {
  return Object.keys(CATEGORY_SLUGS).map((slug) => ({ slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = CATEGORY_SLUGS[slug as keyof typeof CATEGORY_SLUGS] as CategoryLabel | undefined;

  if (!category) {
    notFound();
  }

  const tools = listToolDefinitions().filter(
    (tool) =>
      tool.metadata.category === category &&
      tool.metadata.availability === "active" &&
      (tool.metadata.visibility ?? "public") === "public"
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 md:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Category</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{category}</h1>
        <p className="mt-2 text-sm text-slate-600">Showing only tools in this category.</p>
      </section>

      {tools.length === 0 ? (
        <Card className="border-dashed border-slate-200 bg-white/90">
          <CardContent className="p-8 text-sm text-slate-600">No tools are currently available in this category.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Card key={tool.id} className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-base">{tool.metadata.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">{tool.metadata.description}</p>
                <Button asChild size="sm">
                  <Link href={`/tools/${tool.id}`}>Open Tool</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}