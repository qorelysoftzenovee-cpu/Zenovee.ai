import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { createBreadcrumbSchema, createFAQSchema, createMetadata, createSoftwareSchema } from "@/lib/seo/site";
import { getRelatedBlogPosts, getToolSeoEntry, getToolsBySlugs, toolSeoPages } from "@/lib/seo/content";

export async function generateStaticParams() {
  return toolSeoPages.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolSeoEntry(slug);
  if (!tool) return {};

  return createMetadata({
    title: tool.heroTitle,
    description: tool.heroDescription,
    path: `/tools/${tool.slug}`,
    keywords: [tool.primaryKeyword, `${tool.category} AI tool`, `${tool.shortName} online`],
  });
}

export default async function ToolSeoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolSeoEntry(slug);
  if (!tool) notFound();

  const relatedTools = getToolsBySlugs(tool.relatedToolSlugs);
  const relatedBlogs = getRelatedBlogPosts(tool.slug);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={createSoftwareSchema({ name: tool.name, description: tool.heroDescription, path: `/tools/${tool.slug}`, category: tool.category, featureList: tool.featurePoints })} />
      <JsonLd data={createFAQSchema(tool.faqs)} />
      <JsonLd data={createBreadcrumbSchema([{ name: "Home", path: "/" }, { name: "Tools", path: "/tools" }, { name: tool.name, path: `/tools/${tool.slug}` }])} />
      <Navigation isAuthenticated={false} />
      <main>
        <section className="section-shell py-14 md:py-20">
          <div className="space-y-6">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Tools", href: "/tools" }, { label: tool.name }]} />
            <div className="max-w-4xl space-y-4">
              <p className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">{tool.category}</p>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{tool.heroTitle}</h1>
              <p className="max-w-3xl text-lg text-muted-foreground">{tool.heroDescription}</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/register" data-analytics-event="conversion" data-analytics-label={`tool-register-${tool.slug}`}>
                    Get Started
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/pricing">View pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="section-shell grid gap-6 md:grid-cols-3 pb-16">
          {tool.featurePoints.map((feature) => (
            <Card key={feature}>
              <CardHeader>
                <CardTitle className="text-lg">Feature</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="section-shell grid gap-8 pb-16 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Use cases</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                  {tool.useCases.map((useCase) => (
                    <li key={useCase} className="rounded-xl border p-4">
                      {useCase}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {tool.examples.map((example) => (
                    <div key={example} className="rounded-xl border p-4 text-sm text-muted-foreground">
                      {example}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>FAQs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tool.faqs.map((faq) => (
                  <div key={faq.question} className="rounded-xl border p-4">
                    <h3 className="font-medium">{faq.question}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Related tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedTools.map((item) => (
                  <Link key={item.slug} href={`/tools/${item.slug}`} className="block rounded-xl border p-4 hover:bg-muted/40">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Related blog posts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedBlogs.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="block rounded-xl border p-4 hover:bg-muted/40">
                    <p className="font-medium">{post.title}</p>
                    <p className="text-sm text-muted-foreground">{post.description}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CTA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Use {tool.name} inside Zenovee AI and export or publish your outputs with shareable URLs.</p>
                <Button asChild className="w-full">
                  <Link href="/register" data-analytics-event="conversion" data-analytics-label={`tool-sidebar-register-${tool.slug}`}>
                    Launch tool
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}