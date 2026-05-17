import type { MetadataRoute } from "next";
import { blogCategories, blogPosts, comparisonPages, industryPages, toolCategoryPages, toolSeoPages, useCasePages } from "@/lib/seo/content";
import { absoluteUrl } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/pricing", "/contact", "/privacy", "/terms", "/refund", "/tools", "/blog"];

  return [
    ...staticRoutes.map((path) => ({ url: absoluteUrl(path || "/"), changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...toolSeoPages.map((tool) => ({ url: absoluteUrl(`/tools/${tool.slug}`), changeFrequency: "weekly" as const, priority: 0.9 })),
    ...toolCategoryPages.map((page) => ({ url: absoluteUrl(`/categories/${page.slug}`), changeFrequency: "weekly" as const, priority: 0.75 })),
    ...useCasePages.map((page) => ({ url: absoluteUrl(`/use-cases/${page.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...industryPages.map((page) => ({ url: absoluteUrl(`/industries/${page.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...comparisonPages.map((page) => ({ url: absoluteUrl(`/compare/${page.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...blogCategories.map((category) => ({ url: absoluteUrl(`/blog/category/${category.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...blogPosts.map((post) => ({ url: absoluteUrl(`/blog/${post.slug}`), lastModified: post.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}