import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { blogPosts, blogCategories, getBlogCategory } from "@/lib/seo/content";
import { createMetadata } from "@/lib/seo/site";

export async function generateStaticParams() {
  return blogCategories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getBlogCategory(slug);
  if (!category) return {};
  return createMetadata({ title: `${category.name} Blog`, description: category.description, path: `/blog/category/${category.slug}`, type: "article" });
}

export default async function BlogCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getBlogCategory(slug);
  if (!category) notFound();
  const posts = blogPosts.filter((post) => post.category === category.slug);

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={false} />
      <main className="section-shell py-16 md:py-20 space-y-8">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight">{category.name}</h1>
          <p className="text-lg text-muted-foreground">{category.description}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <Card key={post.slug}>
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{post.description}</p>
                <Link href={`/blog/${post.slug}`} className="mt-4 inline-block text-sm font-medium text-accent">
                  Read post
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