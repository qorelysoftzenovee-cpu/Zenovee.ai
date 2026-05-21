export type WorkspaceKey =
  | "linkedin-authority-os"
  | "sales-outreach-os"
  | "conversion-copy-os"
  | "seo-growth-os"
  | "ai-brand-studio";

export type WorkspaceModuleConfig = {
  id: string;
  name: string;
  description: string;
  toolId?: string;
  availability?: "active" | "coming_soon";
  workflowStage?: "planning" | "generation" | "optimization" | "distribution";
  outputLabel?: string;
};

export type WorkspaceConfig = {
  id: WorkspaceKey;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  audiencePresets: string[];
  tonePresets: string[];
  templatePresets: string[];
  modules: WorkspaceModuleConfig[];
};

export const workspaceRegistry: WorkspaceConfig[] = [
  {
    id: "linkedin-authority-os",
    name: "LinkedIn Authority OS",
    tagline: "Build executive authority with connected content workflows.",
    description: "Create publish-ready LinkedIn content systems with reusable drafts and structured output quality.",
    icon: "🧵",
    audiencePresets: ["Founders", "Executives", "Consultants", "B2B buyers"],
    tonePresets: ["Authority", "Contrarian", "Educational", "Story-led"],
    templatePresets: ["LinkedIn post", "Carousel", "Comment thread", "Newsletter"],
    modules: [
      { id: "executive-ghostwriter", name: "Executive Ghostwriter", description: "Authority-building thought leadership posts.", toolId: "landing-page-copy-generator", workflowStage: "generation", outputLabel: "LinkedIn Post Draft" },
      { id: "carousel-architect", name: "Carousel Architect", description: "Create narrative carousel frameworks.", availability: "coming_soon", workflowStage: "planning", outputLabel: "Carousel Structure" },
      { id: "comment-sniper", name: "Comment Sniper", description: "Context-aware high-signal comments.", toolId: "browser-improve-writing", workflowStage: "distribution", outputLabel: "Comment Variations" },
      { id: "hot-take-generator", name: "Hot Take Generator", description: "Sharp opinion-led posts with hooks.", toolId: "ad-copy-generator", workflowStage: "generation", outputLabel: "Hot-take Hooks" },
      { id: "newsletter-builder", name: "Newsletter Builder", description: "Long-form newsletter structure and drafts.", toolId: "seo-article-generator", workflowStage: "generation", outputLabel: "Newsletter Draft" },
      { id: "profile-optimizer", name: "Profile Optimizer", description: "Profile headline/about optimization.", toolId: "browser-rewrite", workflowStage: "optimization", outputLabel: "Profile Copy" },
      { id: "trend-jacker", name: "Trend-Jacker", description: "Rapid response content from trends.", toolId: "browser-ad-copy", workflowStage: "distribution", outputLabel: "Trend-led Posts" },
    ],
  },
  {
    id: "sales-outreach-os",
    name: "Sales Outreach OS",
    tagline: "Run high-ticket outbound workflows with context memory.",
    description: "Generate and manage prospect-ready sales messaging sequences with CRM-like organization.",
    icon: "🎯",
    audiencePresets: ["SaaS Founders", "Agency Owners", "Sales Leads", "Decision-makers"],
    tonePresets: ["Consultative", "Direct", "Value-first", "Executive"],
    templatePresets: ["Cold email", "InMail", "Follow-up chain", "Proposal"],
    modules: [
      { id: "icebreaker-generator", name: "Icebreaker Generator", description: "Personalized opening lines.", toolId: "browser-rewrite" },
      { id: "cold-pitch-generator", name: "Cold Pitch Generator", description: "Outbound first-touch scripts.", toolId: "ad-copy-generator" },
      { id: "objection-crusher", name: "Objection Crusher", description: "Handle objections with confidence.", toolId: "customer-persona-builder" },
      { id: "re-engagement-engine", name: "Re-engagement Engine", description: "Revive stalled leads.", toolId: "browser-improve-writing" },
      { id: "proposal-writer", name: "Proposal Writer", description: "Structured deal-ready proposals.", toolId: "landing-page-copy-generator" },
      { id: "upsell-architect", name: "Upsell Architect", description: "Expansion offer messaging.", availability: "coming_soon" },
      { id: "inmail-hook-builder", name: "InMail Hook Builder", description: "LinkedIn InMail openers and hooks.", toolId: "ad-copy-generator" },
    ],
  },
  {
    id: "conversion-copy-os",
    name: "Conversion Copy OS",
    tagline: "Build conversion assets by funnel stage and angle.",
    description: "Organize conversion copy production into reusable campaign workflows.",
    icon: "⚡",
    audiencePresets: ["Cold traffic", "Warm leads", "Bottom-funnel buyers"],
    tonePresets: ["Direct response", "Premium", "Problem-solution", "Story"],
    templatePresets: ["AIDA", "PAS", "Hero section", "Email sequence"],
    modules: [
      { id: "aida-engine", name: "AIDA Engine", description: "AIDA-driven conversion messaging.", toolId: "landing-page-copy-generator" },
      { id: "pas-engine", name: "PAS Engine", description: "PAS-structured persuasive copy.", toolId: "ad-copy-generator" },
      { id: "landing-hero-builder", name: "Landing Hero Builder", description: "Hero sections and CTA direction.", toolId: "landing-page-copy-generator" },
      { id: "hook-story-offer-generator", name: "Hook Story Offer Generator", description: "Narrative + offer packaging.", toolId: "ad-copy-generator" },
      { id: "email-subject-lab", name: "Email Subject Lab", description: "Subject line testing variants.", toolId: "browser-ad-copy" },
      { id: "vsl-outliner", name: "VSL Outliner", description: "Video sales letter outline.", toolId: "seo-article-generator" },
      { id: "cart-recovery-sequences", name: "Cart Recovery Sequences", description: "Abandonment recovery message chains.", availability: "coming_soon" },
    ],
  },
  {
    id: "seo-growth-os",
    name: "SEO Growth OS",
    tagline: "Plan and produce search growth systems end-to-end.",
    description: "Cluster keywords, structure briefs, and generate SEO-ready outputs for scalable growth.",
    icon: "📈",
    audiencePresets: ["SEO teams", "Content managers", "Agencies"],
    tonePresets: ["Editorial", "Authoritative", "Educational"],
    templatePresets: ["Keyword map", "Article outline", "Meta pack", "FAQ schema"],
    modules: [
      { id: "keyword-clusterer", name: "Keyword Clusterer", description: "Topical keyword maps.", toolId: "seo-article-generator" },
      { id: "outline-architect", name: "Outline Architect", description: "SERP-ready article outlines.", toolId: "seo-article-generator" },
      { id: "ai-humanizer", name: "AI Humanizer", description: "Improve clarity and readability.", toolId: "browser-improve-writing" },
      { id: "meta-lab", name: "Meta Lab", description: "Title/meta optimization.", toolId: "browser-seo-helper" },
      { id: "internal-linking-strategist", name: "Internal Linking Strategist", description: "Linking recommendations.", toolId: "seo-article-generator" },
      { id: "competitor-gap-analyzer", name: "Competitor Gap Analyzer", description: "Coverage gap discovery.", toolId: "browser-seo-helper" },
      { id: "faq-schema-builder", name: "FAQ Schema Builder", description: "FAQ-ready structured sections.", toolId: "seo-article-generator" },
    ],
  },
  {
    id: "ai-brand-studio",
    name: "AI Brand Studio",
    tagline: "Create premium visual marketing directions and prompt systems.",
    description: "Orchestrate visual concept generation workflows with style and design-system presets.",
    icon: "🎨",
    audiencePresets: ["Brand teams", "Performance marketers", "Creators"],
    tonePresets: ["Minimal", "Bold", "Luxury", "Modern"],
    templatePresets: ["Ad creative", "Thumbnail", "Cover art", "Presentation visual"],
    modules: [
      { id: "blog-banner-generator", name: "Blog Banner Generator", description: "Banner concepts for editorial content.", availability: "coming_soon" },
      { id: "product-scene-builder", name: "Product Scene Builder", description: "Product composition prompts.", availability: "coming_soon" },
      { id: "instagram-ad-concepts", name: "Instagram Ad Concepts", description: "Visual concept packs.", availability: "coming_soon" },
      { id: "youtube-thumbnail-concepts", name: "YouTube Thumbnail Concepts", description: "High-CTR thumbnail ideas.", availability: "coming_soon" },
      { id: "ebook-cover-concepts", name: "E-Book Cover Concepts", description: "Premium cover directions.", availability: "coming_soon" },
      { id: "presentation-backgrounds", name: "Presentation Backgrounds", description: "Slide background systems.", availability: "coming_soon" },
      { id: "podcast-cover-concepts", name: "Podcast Cover Concepts", description: "Podcast cover ideation.", availability: "coming_soon" },
    ],
  },
];

export function listWorkspaceConfigs() {
  return workspaceRegistry;
}
