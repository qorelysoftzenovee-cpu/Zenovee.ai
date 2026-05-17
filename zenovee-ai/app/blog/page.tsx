import Link from "next/link";
import type { Metadata } from "next";
import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { blogCategories, blogPosts } from "@/lib/seo/content";
import { createMetadata } from "@/lib/seo/site";

export const metadata: Metadata = createMetadata({
  title: "AI Marketing, SEO, SaaS Growth, and Productivity Blog",
  description: "Read structured articles about AI marketing, SEO systems, SaaS growth, and productivity workflows.",
  path: "/blog",
  type: "article",
});

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={false} />
      <main className="section-shell py-16 md:py-20 space-y-10">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight">SEO blog system</h1>
          <p className="text-lg text-muted-foreground">Browse articles across AI marketing, SEO, SaaS growth, and productivity.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {blogCategories.map((category) => (
            <Link key={category.slug} href={`/blog/category/${category.slug}`} className="rounded-2xl border p-5 hover:bg-muted/40">
              <p className="font-medium">{category.name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {blogPosts.map((post) => (
            <Card key={post.slug}>
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{post.description}</p>
                <Link href={`/blog/${post.slug}`} className="mt-4 inline-block text-sm font-medium text-accent">
                  Read article
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