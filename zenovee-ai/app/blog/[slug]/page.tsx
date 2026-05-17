import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JsonLd } from "@/components/seo/json-ld";
import { blogPosts, getBlogCategory, getBlogPost, getRelatedBlogPostsByCategory, getToolsBySlugs } from "@/lib/seo/content";
import { createArticleSchema, createMetadata } from "@/lib/seo/site";

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return createMetadata({ title: post.title, description: post.description, path: `/blog/${post.slug}`, type: "article" });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const category = getBlogCategory(post.category);
  const relatedPosts = getRelatedBlogPostsByCategory(post.category, post.slug);
  const relatedTools = getToolsBySlugs(post.relatedToolSlugs);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={createArticleSchema({ title: post.title, description: post.description, path: `/blog/${post.slug}`, publishedTime: post.publishedAt, modifiedTime: post.updatedAt, category: category?.name || post.category })} />
      <Navigation isAuthenticated={false} />
      <main className="section-shell py-16 md:py-20 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="space-y-8">
          <header className="space-y-4">
            <p className="text-sm text-accent">{category?.name}</p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{post.title}</h1>
            <p className="text-lg text-muted-foreground">{post.description}</p>
          </header>

          <div className="space-y-5 text-base leading-8 text-muted-foreground">
            {post.content.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Related tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {relatedTools.map((tool) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`} className="block rounded-xl border p-4 hover:bg-muted/40">
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </Link>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Related blogs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {relatedPosts.map((item) => (
                <Link key={item.slug} href={`/blog/${item.slug}`} className="block rounded-xl border p-4 hover:bg-muted/40">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </Link>
              ))}
            </CardContent>
          </Card>
        </aside>
      </main>
      <Footer />
    </div>
  );
}