import { listToolDefinitions } from "@/definitions";
import type { ToolOutputType } from "@/types/tools";

type FAQ = { question: string; answer: string };

export type ToolSeoEntry = {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: string;
  icon: string;
  tagline: string;
  tags: string[];
  featured: boolean;
  trending: boolean;
  estimatedTimeSeconds?: number;
  outputType?: ToolOutputType;
  heroTitle: string;
  heroDescription: string;
  featurePoints: string[];
  useCases: string[];
  examples: string[];
  faqs: FAQ[];
  relatedToolSlugs: string[];
  primaryKeyword: string;
  industries: string[];
};

type ToolSeoNarrative = Omit<
  ToolSeoEntry,
  "slug" | "name" | "shortName" | "description" | "category" | "icon" | "tagline" | "tags" | "featured" | "trending" | "estimatedTimeSeconds" | "outputType"
>;

const toolSpecificCopy: Record<string, ToolSeoNarrative> = {
  "seo-article-generator": {
    heroTitle: "AI SEO Article Generator for high-intent organic growth",
    heroDescription:
      "Create search-optimized long-form articles with outlines, keyword clusters, FAQs, and internal link suggestions for sustained rankings.",
    featurePoints: [
      "Build full article structures from a target keyword and audience brief",
      "Generate metadata, search intent alignment, and FAQ-rich content",
      "Create export-ready drafts for SaaS, agencies, and in-house SEO teams",
    ],
    useCases: ["Content marketing", "Agency content production", "B2B SaaS SEO", "Blog scaling"],
    examples: [
      "SEO article generator for agencies",
      "AI tool for long-form content briefs",
      "Keyword-focused article drafting workflow",
    ],
    faqs: [
      { question: "What can this SEO article generator create?", answer: "It generates SEO titles, descriptions, intent framing, clustered keywords, outlines, long-form drafts, FAQs, and internal linking ideas." },
      { question: "Who is this tool best for?", answer: "It is built for SEO teams, marketers, SaaS operators, and agencies who need production-ready article workflows." },
      { question: "Can I export the results?", answer: "Yes. Generated outputs can be exported and published with shareable public URLs." },
    ],
    relatedToolSlugs: ["landing-page-copy-generator", "ad-copy-generator", "customer-persona-builder"],
    primaryKeyword: "AI SEO article generator",
    industries: ["saas", "agencies", "ecommerce", "education"],
  },
  "ad-copy-generator": {
    heroTitle: "AI Ad Copy Generator for faster campaign launches",
    heroDescription:
      "Generate conversion-focused ad angles, headlines, body copy, and CTA variants for paid media teams across Meta, Google, LinkedIn, and X.",
    featurePoints: [
      "Create multi-angle ad packs for different platforms and offers",
      "Generate headline sets, body variations, and call-to-action combinations",
      "Support fast iteration for performance marketing teams",
    ],
    useCases: ["Performance marketing", "Paid social", "Demand generation", "Product launches"],
    examples: ["Best AI ad copy generator", "Google ads copy assistant", "Meta ads creative ideation"],
    faqs: [
      { question: "Does the ad copy generator support multiple platforms?", answer: "Yes. It can generate copy tailored to platforms like Meta, Google, LinkedIn, and X." },
      { question: "Can teams use it for testing angles?", answer: "Yes. It produces multiple headline and body variations to support creative testing." },
      { question: "Is it useful for ecommerce offers?", answer: "Yes. It works well for product offers, paid promos, promotions, and demand capture campaigns." },
    ],
    relatedToolSlugs: ["customer-persona-builder", "landing-page-copy-generator", "seo-article-generator"],
    primaryKeyword: "AI ad copy generator",
    industries: ["ecommerce", "saas", "agencies", "coaching"],
  },
  "customer-persona-builder": {
    heroTitle: "AI Customer Persona Builder for sharper messaging",
    heroDescription:
      "Turn business context into structured buyer personas with pain points, goals, objections, triggers, and messaging angles for growth teams.",
    featurePoints: [
      "Generate segmented persona profiles from business and market inputs",
      "Identify objections, motivations, and content ideas for campaigns",
      "Align product, content, and sales messaging with customer insights",
    ],
    useCases: ["Messaging research", "Go-to-market planning", "Audience segmentation", "Conversion copy"],
    examples: ["Customer persona builder for SaaS", "AI buyer persona generator", "Audience research assistant"],
    faqs: [
      { question: "What does the persona builder return?", answer: "It returns buyer persona summaries, demographics, pain points, goals, objections, buying triggers, and content ideas." },
      { question: "Who should use this tool?", answer: "Founders, marketers, copywriters, and agencies can use it to clarify positioning and campaigns." },
      { question: "Can it support sales messaging?", answer: "Yes. The output includes objection handling and messaging angles that can inform sales and landing page copy." },
    ],
    relatedToolSlugs: ["landing-page-copy-generator", "ad-copy-generator", "seo-article-generator"],
    primaryKeyword: "AI customer persona builder",
    industries: ["saas", "consulting", "ecommerce", "healthcare"],
  },
  "landing-page-copy-generator": {
    heroTitle: "AI Landing Page Copy Generator for conversion-first pages",
    heroDescription:
      "Create structured landing page copy with hero messaging, benefits, problem-solution framing, FAQs, and strong CTAs for launches and campaigns.",
    featurePoints: [
      "Generate hero messaging and conversion-focused sections from a short brief",
      "Build landing page benefit stacks, testimonial prompts, and FAQs",
      "Speed up page production for product launches and acquisition funnels",
    ],
    useCases: ["Product launches", "Lead generation", "Offer pages", "Agency delivery"],
    examples: ["Landing page copy generator for SaaS", "AI conversion copywriter", "Product page messaging builder"],
    faqs: [
      { question: "What sections are included?", answer: "The tool generates hero copy, CTA ideas, problem framing, solution framing, benefits, FAQs, and a final CTA section." },
      { question: "Can I use it for agency work?", answer: "Yes. It is suitable for freelancers and agencies creating client landing pages quickly." },
      { question: "Does it help with messaging clarity?", answer: "Yes. It organizes positioning into a structured page narrative built for conversions." },
    ],
    relatedToolSlugs: ["customer-persona-builder", "ad-copy-generator", "seo-article-generator"],
    primaryKeyword: "AI landing page copy generator",
    industries: ["saas", "agencies", "ecommerce", "coaching"],
  },
};

export const toolSeoPages: ToolSeoEntry[] = listToolDefinitions()
  .filter((tool) => tool.metadata.availability !== "coming_soon")
  .map((tool) => {
    const specific = toolSpecificCopy[tool.id] || {
      heroTitle: `${tool.metadata.name} for practical AI workflows`,
      heroDescription: tool.metadata.description,
      featurePoints: [tool.metadata.description],
      useCases: [tool.metadata.category],
      examples: [tool.metadata.name],
      faqs: [{ question: `What does ${tool.metadata.name} do?`, answer: tool.metadata.description }],
      relatedToolSlugs: [],
      primaryKeyword: tool.metadata.name,
      industries: ["saas"],
    };

    return {
      slug: tool.id,
      name: tool.metadata.name,
      shortName: tool.metadata.name.replace(/^AI\s+/i, ""),
      description: tool.metadata.description,
      category: tool.metadata.category,
      icon: tool.metadata.icon,
      ...specific,
      tagline: tool.metadata.tagline ?? tool.metadata.description,
      tags: tool.metadata.tags ?? [tool.metadata.category],
      featured: Boolean(tool.metadata.featured),
      trending: Boolean(tool.metadata.trending),
      estimatedTimeSeconds: tool.metadata.estimatedTimeSeconds,
      outputType: tool.metadata.outputType,
    };
  });

export const toolCategoryPages = [
  {
    slug: "seo",
    title: "AI SEO Tools",
    description: "Discover AI SEO tools for article generation, optimization workflows, content planning, and long-term organic traffic systems.",
    intro: "Use Zenovee AI SEO tools to build topic coverage, generate optimized content, and scale discoverable assets.",
    toolSlugs: ["seo-article-generator", "landing-page-copy-generator"],
  },
  {
    slug: "marketing",
    title: "AI Marketing Tools",
    description: "Explore AI marketing tools for ad copy, positioning, personas, landing pages, and campaign production.",
    intro: "Build faster marketing workflows with tools designed for campaign planning, content, and conversion copy.",
    toolSlugs: ["ad-copy-generator", "customer-persona-builder", "landing-page-copy-generator", "seo-article-generator"],
  },
  {
    slug: "copywriting",
    title: "AI Copywriting Tools",
    description: "Compare AI copywriting tools for landing pages, ads, blogs, and conversion messaging.",
    intro: "Create persuasive marketing copy with purpose-built generators for channels across the funnel.",
    toolSlugs: ["ad-copy-generator", "landing-page-copy-generator", "seo-article-generator"],
  },
];

export const useCasePages = [
  {
    slug: "ai-tools-for-marketers",
    title: "AI Tools for Marketers",
    description: "A curated set of AI tools for marketers handling SEO, ad copy, landing page messaging, and persona research.",
    intro: "This route connects high-intent marketing searches with practical AI workflows that can be used immediately.",
    toolSlugs: ["seo-article-generator", "ad-copy-generator", "customer-persona-builder", "landing-page-copy-generator"],
  },
  {
    slug: "best-ai-ad-copy-generator",
    title: "Best AI Ad Copy Generator",
    description: "Evaluate an AI ad copy generator built for conversion-focused campaigns, platform variants, and fast testing cycles.",
    intro: "Built for teams that need structured copy variations instead of shallow one-line outputs.",
    toolSlugs: ["ad-copy-generator", "customer-persona-builder"],
  },
  {
    slug: "seo-article-generator-for-agencies",
    title: "SEO Article Generator for Agencies",
    description: "Generate agency-ready SEO articles with metadata, outlines, and FAQ sections designed for organic growth delivery.",
    intro: "Designed for agencies that need repeatable content systems and export-ready deliverables.",
    toolSlugs: ["seo-article-generator", "landing-page-copy-generator"],
  },
];

export const industryPages = [
  {
    slug: "ecommerce",
    title: "AI Tools for Ecommerce",
    description: "Use AI tools for ecommerce campaigns, product messaging, audience research, and search-friendly content production.",
    intro: "Ecommerce teams can use these workflows to speed up creative production and improve acquisition pages.",
    toolSlugs: ["ad-copy-generator", "landing-page-copy-generator", "customer-persona-builder"],
  },
  {
    slug: "saas",
    title: "AI Tools for SaaS",
    description: "AI tools for SaaS growth teams managing SEO content, positioning, product messaging, and campaign launches.",
    intro: "SaaS teams can use Zenovee to move from messaging research to acquisition assets inside one platform.",
    toolSlugs: ["seo-article-generator", "customer-persona-builder", "landing-page-copy-generator", "ad-copy-generator"],
  },
  {
    slug: "agencies",
    title: "AI Tools for Agencies",
    description: "AI tools for agencies delivering content, ad copy, landing pages, and strategic audience research at scale.",
    intro: "Agency operators can use these tools as packaged delivery workflows for multiple client types.",
    toolSlugs: ["seo-article-generator", "ad-copy-generator", "customer-persona-builder", "landing-page-copy-generator"],
  },
];

export const comparisonPages = [
  {
    slug: "seo-article-generator-vs-ad-copy-generator",
    title: "SEO Article Generator vs Ad Copy Generator",
    description: "Compare long-form organic content workflows with paid campaign copy generation to choose the right AI tool for the job.",
    intro: "Both tools support growth, but each is designed for different traffic channels and production needs.",
    toolSlugs: ["seo-article-generator", "ad-copy-generator"],
  },
  {
    slug: "customer-persona-builder-vs-landing-page-copy-generator",
    title: "Customer Persona Builder vs Landing Page Copy Generator",
    description: "Compare audience research outputs with conversion copy outputs for teams mapping the full messaging workflow.",
    intro: "Use the persona builder for insight discovery and the landing page generator for execution-ready copy blocks.",
    toolSlugs: ["customer-persona-builder", "landing-page-copy-generator"],
  },
];

export const blogCategories = [
  { slug: "ai-marketing", name: "AI Marketing", description: "Guides on using AI in campaigns, messaging, and go-to-market systems." },
  { slug: "seo", name: "SEO", description: "Articles about organic traffic, content systems, and technical SEO workflows." },
  { slug: "saas-growth", name: "SaaS Growth", description: "Practical SaaS growth frameworks for acquisition, activation, and retention." },
  { slug: "productivity", name: "Productivity", description: "Operational guides for faster execution with AI-enabled workflows." },
];

export const blogPosts = [
  {
    slug: "ai-seo-content-system-for-saas",
    title: "Build an AI SEO content system for SaaS",
    description: "A structured SEO system for SaaS teams using AI tools, landing pages, FAQs, and internal links to grow organic traffic.",
    category: "seo",
    publishedAt: "2026-05-10T09:00:00.000Z",
    updatedAt: "2026-05-10T09:00:00.000Z",
    relatedToolSlugs: ["seo-article-generator", "landing-page-copy-generator"],
    content: [
      "An SEO system compounds when every tool page targets a clear problem, audience, and use case.",
      "Instead of publishing shallow directories, create pages with examples, FAQs, structured metadata, and strong internal linking.",
      "For SaaS teams, the content engine should connect blog content to tool pages, use-case pages, and shareable public outputs.",
    ],
  },
  {
    slug: "how-to-scale-ai-ad-creative-workflows",
    title: "How to scale AI ad creative workflows",
    description: "Use AI systems to accelerate ad copy ideation, audience research, and landing page alignment across campaigns.",
    category: "ai-marketing",
    publishedAt: "2026-05-11T09:00:00.000Z",
    updatedAt: "2026-05-11T09:00:00.000Z",
    relatedToolSlugs: ["ad-copy-generator", "customer-persona-builder", "landing-page-copy-generator"],
    content: [
      "The fastest ad workflows connect research, messaging, and copy production rather than treating each asset separately.",
      "A persona layer improves targeting quality while a landing page layer keeps message match strong after the click.",
      "When outputs are structured, teams can export, publish, and iterate faster without rewriting from scratch.",
    ],
  },
  {
    slug: "internal-linking-for-programmatic-seo-pages",
    title: "Internal linking for programmatic SEO pages",
    description: "Learn how to connect tool pages, blog content, categories, and use cases to strengthen crawl paths and topical depth.",
    category: "seo",
    publishedAt: "2026-05-12T09:00:00.000Z",
    updatedAt: "2026-05-12T09:00:00.000Z",
    relatedToolSlugs: ["seo-article-generator", "customer-persona-builder"],
    content: [
      "Programmatic SEO works best when templates are connected with intentional internal links, not isolated at the URL level.",
      "Each tool page should link to categories, industries, and blog articles that extend the same topic cluster.",
      "This structure improves discoverability while helping users move between strategy, content, and execution layers.",
    ],
  },
  {
    slug: "ai-productivity-stacks-for-growth-teams",
    title: "AI productivity stacks for growth teams",
    description: "A practical productivity stack for growth teams using AI tools to reduce manual work and accelerate publishing cycles.",
    category: "productivity",
    publishedAt: "2026-05-13T09:00:00.000Z",
    updatedAt: "2026-05-13T09:00:00.000Z",
    relatedToolSlugs: ["seo-article-generator", "ad-copy-generator", "landing-page-copy-generator"],
    content: [
      "Productivity gains happen when tools fit together across planning, content creation, copy review, and publishing.",
      "A structured AI stack helps teams move quickly without losing consistency in output quality.",
      "That is especially important for growth teams managing both organic and paid channels in parallel.",
    ],
  },
];

export function getToolSeoEntry(slug: string) {
  return toolSeoPages.find((tool) => tool.slug === slug);
}

export function getToolsBySlugs(slugs: string[]) {
  return slugs.map((slug) => getToolSeoEntry(slug)).filter((tool): tool is ToolSeoEntry => Boolean(tool));
}

export function getRelatedBlogPosts(toolSlug: string) {
  return blogPosts.filter((post) => post.relatedToolSlugs.includes(toolSlug));
}

export function getBlogCategory(slug: string) {
  return blogCategories.find((category) => category.slug === slug);
}

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getRelatedBlogPostsByCategory(category: string, excludeSlug?: string) {
  return blogPosts.filter((post) => post.category === category && post.slug !== excludeSlug);
}