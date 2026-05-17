import type { Metadata } from "next";
import { env } from "@/lib/env";

export const SITE_NAME = env.NEXT_PUBLIC_APP_NAME || "Zenovee AI";
export const SITE_URL = (env.NEXT_PUBLIC_APP_URL || "https://zenovee.ai").replace(/\/$/, "");
export const SITE_DESCRIPTION =
  "Zenovee AI is an AI tools platform for SEO, marketing, SaaS growth, and productivity with publishable outputs, tool landing pages, and programmatic discovery routes.";

export function absoluteUrl(path = "/") {
  if (!path.startsWith("/")) {
    return `${SITE_URL}/${path}`;
  }

  return `${SITE_URL}${path}`;
}

export function buildTitle(title?: string) {
  return title ? `${title} | ${SITE_NAME}` : SITE_NAME;
}

export function buildOgImageUrl(title: string, subtitle?: string) {
  const search = new URLSearchParams({ title, subtitle: subtitle || SITE_NAME });
  return absoluteUrl(`/api/og?${search.toString()}`);
}

type MetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: "website" | "article";
  image?: string;
  noIndex?: boolean;
};

export function createMetadata({ title, description, path, keywords, type = "website", image, noIndex = false }: MetadataInput): Metadata {
  const url = absoluteUrl(path);
  const ogImage = image || buildOgImageUrl(title, description);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: buildTitle(title),
      description,
      url,
      siteName: SITE_NAME,
      type,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: buildTitle(title),
      description,
      images: [ogImage],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export function createBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function createFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function createSoftwareSchema(input: {
  name: string;
  description: string;
  path: string;
  category: string;
  featureList: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    applicationCategory: input.category,
    operatingSystem: "Web",
    description: input.description,
    url: absoluteUrl(input.path),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: input.featureList,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export function createArticleSchema(input: {
  title: string;
  description: string;
  path: string;
  publishedTime: string;
  modifiedTime?: string;
  category: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    datePublished: input.publishedTime,
    dateModified: input.modifiedTime || input.publishedTime,
    articleSection: input.category,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    mainEntityOfPage: absoluteUrl(input.path),
  };
}