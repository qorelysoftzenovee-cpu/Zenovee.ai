import type { MetadataRoute } from "next";
import { toolSeoPages } from "@/lib/seo/content";
import { absoluteUrl } from "@/lib/seo/site";

const launchToolSlugs = new Set([
  "seo-article-generator",
  "ad-copy-generator",
  "customer-persona-builder",
  "landing-page-copy-generator",
]);

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/pricing", "/contact", "/privacy", "/terms", "/refund", "/tools"];

  return [
    ...staticRoutes.map((path) => ({ url: absoluteUrl(path || "/"), changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...toolSeoPages
      .filter((tool) => launchToolSlugs.has(tool.slug))
      .map((tool) => ({ url: absoluteUrl(`/tools/${tool.slug}`), changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}