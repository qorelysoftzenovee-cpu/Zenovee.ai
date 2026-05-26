import { z } from "zod";
import type { ToolDefinition } from "@/types/tools";

const hiddenPublicToolIds = new Set(
  (process.env.NEXT_PUBLIC_HIDDEN_TOOL_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
);

export const isPublicToolHidden = (toolId: string) => hiddenPublicToolIds.has(toolId);

export const TOOL_CATEGORIES = {
  EXECUTIVE_BRANDING: "Executive Branding",
  B2B_SALES: "B2B Sales",
  CONVERSION_COPY: "Conversion Copywriting",
  SEO_AUTHORITY: "SEO & Authority",
  PREMIUM_ASSETS: "Premium Image/Brand Assets",
  BROWSER_TOOLS: "Browser Tools",
} as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[keyof typeof TOOL_CATEGORIES];
export type ToolVisibility = "public" | "internal";
export type ToolAvailability = "active" | "coming_soon";
export type ToolExecutionContext = Record<string, unknown>;
export type ToolExecutionResult = Record<string, unknown>;
export type ToolPricingInfo = { toolId: string; creditCost: number; usageClass?: "standard" | "heavy" };
type ToolComplexity = "light" | "medium" | "heavy";

function parseJsonResponse<T>(response: string): T {
  const normalized = response.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(normalized) as T;
}

// Category-specialized schemas
const executiveInputSchema = z.object({
  objective: z.string().min(5),
  executivePersona: z.string().min(3),
  audiencePsychology: z.string().min(5),
  authorityPositioning: z.string().min(5),
  platform: z.enum(["LinkedIn", "Newsletter", "Podcast", "X"]),
  storytellingStyle: z.string().min(3),
  constraints: z.string().optional().default(""),
});
const executiveOutputSchema = z.object({
  strategicHook: z.string(),
  hookAnalysis: z.array(z.string()),
  storytellingStructure: z.array(z.string()),
  authorityAngles: z.array(z.string()),
  audiencePsychologyTriggers: z.array(z.string()),
  engagementScore: z.number().min(1).max(100),
  finalDraft: z.string(),
});

const salesInputSchema = z.object({
  offer: z.string().min(3),
  icp: z.string().min(3),
  buyerStage: z.enum(["cold", "aware", "considering", "decision"]),
  topObjections: z.array(z.string()).min(1),
  desiredCTA: z.string().min(2),
  channel: z.enum(["email", "linkedin", "call", "proposal"]),
});
const salesOutputSchema = z.object({
  icpAlignmentScore: z.number().min(1).max(100),
  objectionHandlingFrames: z.array(z.string()),
  buyerPsychologyLevers: z.array(z.string()),
  concisePitch: z.string(),
  enterpriseFraming: z.array(z.string()),
  ctaScore: z.number().min(1).max(100),
  conversionSequence: z.array(z.string()),
});

const copyInputSchema = z.object({
  product: z.string().min(3),
  audience: z.string().min(3),
  awarenessLevel: z.enum(["unaware", "problem-aware", "solution-aware", "product-aware", "most-aware"]),
  framework: z.enum(["AIDA", "PAS", "BAB", "4Ps", "VSL"]),
  emotionalGoal: z.string().min(3),
  offer: z.string().min(2),
});
const copyOutputSchema = z.object({
  frameworkBlocks: z.array(z.object({ section: z.string(), copy: z.string() })),
  emotionalTriggers: z.array(z.string()),
  conversionAngles: z.array(z.string()),
  ctaHierarchy: z.array(z.string()),
  scrollStoppingHooks: z.array(z.string()),
  finalCopy: z.string(),
});

const seoInputSchema = z.object({
  primaryTopic: z.string().min(3),
  businessContext: z.string().min(5),
  intentFocus: z.enum(["informational", "commercial", "transactional", "navigational"]),
  geoOrNiche: z.string().optional().default("global"),
  competitorContext: z.string().optional().default(""),
});
const seoOutputSchema = z.object({
  intentAnalysis: z.array(z.string()),
  semanticClusters: z.array(z.object({ cluster: z.string(), keywords: z.array(z.string()) })),
  topicalAuthorityMap: z.array(z.string()),
  metadata: z.object({ seoTitle: z.string(), metaDescription: z.string() }),
  faqBlocks: z.array(z.object({ question: z.string(), answer: z.string() })),
  internalLinkingPlan: z.array(z.string()),
  contentStructure: z.array(z.string()),
});

const imageInputSchema = z.object({
  assetGoal: z.string().min(3),
  brandAesthetic: z.string().min(3),
  subject: z.string().min(2),
  platform: z.enum(["YouTube", "Instagram", "Landing", "Ads", "Presentation"]),
  mood: z.string().min(2),
  constraints: z.string().optional().default(""),
});
const imageOutputSchema = z.object({
  masterPrompt: z.string(),
  compositionInstructions: z.array(z.string()),
  lightingInstructions: z.array(z.string()),
  cameraStyleDirection: z.array(z.string()),
  premiumAestheticRules: z.array(z.string()),
  variations: z.array(z.string()),
});

const browserInputSchema = z.object({ pageTitle: z.string().optional().default(""), pageUrl: z.string().optional().default(""), selection: z.string().optional().default(""), instruction: z.string().min(2) });
const browserOutputSchema = z.object({ result: z.string(), suggestions: z.array(z.string()).default([]) });

type Item = {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  creditCost: number;
  featured?: boolean;
  trending?: boolean;
  usageClass?: "standard" | "heavy";
  complexity: ToolComplexity;
  premiumBadge: string;
  expectedOutputValue: string;
  creditTooltip: string;
};

const LIGHT_COSTS = [50, 75, 100];
const MEDIUM_COSTS = [150, 225, 300, 400];
const HEAVY_COSTS = [500, 750, 1000, 1500];

function getComplexityByCategoryIndex(index: number): ToolComplexity {
  if (index < 3) return "light";
  if (index < 7) return "medium";
  return "heavy";
}

function getCreditCostByComplexity(complexity: ToolComplexity, index: number) {
  if (complexity === "light") return LIGHT_COSTS[index % LIGHT_COSTS.length];
  if (complexity === "medium") return MEDIUM_COSTS[index % MEDIUM_COSTS.length];
  return HEAVY_COSTS[index % HEAVY_COSTS.length];
}

function getPremiumBadge(complexity: ToolComplexity) {
  if (complexity === "heavy") return "Premium Workflow";
  if (complexity === "medium") return "Premium Builder";
  return "Premium Quick Win";
}

function getExpectedOutputValue(complexity: ToolComplexity) {
  if (complexity === "heavy") return "High-value multi-step strategy output";
  if (complexity === "medium") return "Structured campaign-ready deliverable";
  return "Fast premium execution asset";
}

const CREDIT_TOOLTIP = "Advanced AI workflows consume more credits due to larger generation complexity.";

const idsByCategory: Record<ToolCategory, string[]> = {
  [TOOL_CATEGORIES.EXECUTIVE_BRANDING]: ["executive-thought-leader-ghostwriter","viral-carousel-architect","linkedin-authority-engine","influence-loop-designer","authority-content-calendar","personal-brand-positioning-matrix","signature-framework-forger","authority-story-bank-builder","podcast-guest-angle-crafter","founder-voice-calibrator"],
  [TOOL_CATEGORIES.B2B_SALES]: ["cold-outreach-sequence-engine","enterprise-objection-crusher","proposal-narrative-architect","upsell-expansion-playbook","dm-to-demo-converter","account-prioritization-scorer","decision-maker-brief-builder","deal-risk-early-warning-ai","multi-threading-message-planner","discovery-call-intelligence-designer"],
  [TOOL_CATEGORIES.CONVERSION_COPY]: ["vsl-script-architect","landing-page-conversion-maximizer","offer-angle-multiplier","checkout-friction-remover","headline-ctr-dominator","email-sequence-revenue-driver","webinar-pitch-intensifier","ad-angle-to-funnel-bridge","cta-psychology-optimizer","high-ticket-case-study-writer"],
  [TOOL_CATEGORIES.SEO_AUTHORITY]: ["semantic-keyword-clusterer","topical-authority-engine","internal-link-architecture-pro","schema-impact-generator","pillar-page-strategist","serp-intent-decoder","content-gap-opportunity-miner","entity-seo-mapper","programmatic-seo-brief-factory","authority-linkable-asset-planner"],
  [TOOL_CATEGORIES.PREMIUM_ASSETS]: ["high-end-thumbnail-designer","studio-product-placer","hero-banner-visual-planner","social-ad-visual-variator","visual-brand-moodboard-generator","brand-style-consistency-ai","campaign-asset-suite-planner","premium-infographic-layout-engine","video-scene-art-direction-ai","brand-illustration-style-forger"],
  [TOOL_CATEGORIES.BROWSER_TOOLS]: ["browser-rewrite","browser-improve-writing","browser-seo-helper","browser-ad-copy"],
};

function titleFromId(id: string) { return id.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" "); }

const premiumItems: Item[] = (Object.entries(idsByCategory) as [ToolCategory, string[]][])
  .filter(([category]) => category !== TOOL_CATEGORIES.BROWSER_TOOLS)
  .flatMap(([category, ids]) =>
    ids.map((id, i) => {
      const complexity = getComplexityByCategoryIndex(i);

      return {
        id,
        name: titleFromId(id),
        description: `${titleFromId(id)} specialized for ${category.toLowerCase()} outcomes.`,
        category,
        icon: category === TOOL_CATEGORIES.EXECUTIVE_BRANDING ? "🧠" : category === TOOL_CATEGORIES.B2B_SALES ? "🎯" : category === TOOL_CATEGORIES.CONVERSION_COPY ? "⚡" : category === TOOL_CATEGORIES.SEO_AUTHORITY ? "📈" : "🎨",
        creditCost: getCreditCostByComplexity(complexity, i),
        featured: i < 2,
        trending: i < 3,
        usageClass: complexity === "heavy" ? "heavy" : "standard",
        complexity,
        premiumBadge: getPremiumBadge(complexity),
        expectedOutputValue: getExpectedOutputValue(complexity),
        creditTooltip: CREDIT_TOOLTIP,
      };
    })
  );

function buildPrompt(item: Item, input: Record<string, unknown>) {
  const base = `You are a top-tier ${item.category} specialist system named "${item.name}".\nOutput must be premium, domain-specific, non-generic, and structured JSON only.`;
  const guardrails = `\nRules: no fluff, no repeated wording, no generic advice, include scoring + strategic rationale.`;
  return `${base}${guardrails}\nInput:\n${JSON.stringify(input, null, 2)}`;
}

function buildTool(item: Item): ToolDefinition {
  const isExec = item.category === TOOL_CATEGORIES.EXECUTIVE_BRANDING;
  const isSales = item.category === TOOL_CATEGORIES.B2B_SALES;
  const isCopy = item.category === TOOL_CATEGORIES.CONVERSION_COPY;
  const isSeo = item.category === TOOL_CATEGORIES.SEO_AUTHORITY;
  const inputSchema = isExec ? executiveInputSchema : isSales ? salesInputSchema : isCopy ? copyInputSchema : isSeo ? seoInputSchema : imageInputSchema;
  const outputSchema = isExec ? executiveOutputSchema : isSales ? salesOutputSchema : isCopy ? copyOutputSchema : isSeo ? seoOutputSchema : imageOutputSchema;

  const formatOptionLabel = (value: string) =>
    value.replace(/[-_]/g, " ").replace(/\b\w/g, (char: string) => char.toUpperCase());

  const shape = (inputSchema as z.ZodObject<z.ZodRawShape>).shape;
  const fields = Object.entries(shape).map(([key, schema]) => {
    const unwrapped = schema instanceof z.ZodOptional || schema instanceof z.ZodDefault ? schema._def.innerType : schema;
    const isEnum = unwrapped instanceof z.ZodEnum;
    const options = isEnum
      ? Array.from((unwrapped as unknown as { options: readonly string[] }).options).map((value) => ({
          label: formatOptionLabel(value),
          value,
        }))
      : undefined;

    return {
      name: key,
      label: key.replace(/([A-Z])/g, " $1").trim(),
      type: isEnum ? ("select" as const) : ("textarea" as const),
      required: !(schema instanceof z.ZodOptional) && !(schema instanceof z.ZodDefault),
      options,
      placeholder: `Enter ${key.replace(/([A-Z])/g, " $1").toLowerCase()}`,
    };
  });

  return {
    id: item.id,
    metadata: {
      name: item.name,
      description: item.description,
      category: item.category,
      icon: item.icon,
      tagline: `${item.name} — specialized professional system`,
      outputType: isSeo ? "article" : isCopy ? "landing-page" : isSales ? "ad-copy" : "text",
      estimatedTimeSeconds: item.usageClass === "heavy" ? 75 : 40,
      tags: [item.category, "Premium", "Specialized"],
      featured: Boolean(item.featured),
      trending: Boolean(item.trending),
      availability: "active",
      visibility: "public",
      premiumBadge: item.premiumBadge,
      complexity: item.complexity,
      expectedOutputValue: item.expectedOutputValue,
      creditTooltip: item.creditTooltip,
    },
    fields,
    examples: [{ title: `${item.name} run`, description: item.description }],
    presets: [],
    inputSchema,
    outputSchema,
    creditCost: item.creditCost,
    usageClass: item.usageClass ?? "standard",
    aiModel: item.usageClass === "heavy" ? "llama-3.1-70b-versatile" : "mixtral-8x7b",
    exportFormats: ["txt", "md", "pdf", "json"],
    promptTemplate: (input) => buildPrompt(item, input as Record<string, unknown>),
    outputFormatter: (response) => parseJsonResponse(response),
  };
}

export const premiumToolDefinitions: ToolDefinition[] = premiumItems.map(buildTool);

export const internalToolDefinitions: ToolDefinition[] = idsByCategory[TOOL_CATEGORIES.BROWSER_TOOLS].map((id) => ({
  id,
  metadata: { name: titleFromId(id), description: `${titleFromId(id)} internal browser utility.`, category: TOOL_CATEGORIES.BROWSER_TOOLS, icon: "🧩", visibility: "internal", availability: "active", trending: true, complexity: "light", premiumBadge: "Internal Utility", expectedOutputValue: "Fast page-aware utility action", creditTooltip: CREDIT_TOOLTIP },
  fields: [],
  inputSchema: browserInputSchema,
  outputSchema: browserOutputSchema,
  creditCost: 10,
  usageClass: "standard",
  aiModel: "llama-3.1-70b-versatile",
  promptTemplate: (i) => `Browser tool ${id}.\n${JSON.stringify(i)}`,
  outputFormatter: (r) => parseJsonResponse(r),
  exportFormats: ["txt", "md", "pdf", "json"],
}));

export const allToolDefinitions: ToolDefinition[] = [...premiumToolDefinitions, ...internalToolDefinitions];
export const toolRegistry: Record<string, ToolDefinition> = Object.fromEntries(allToolDefinitions.map((t) => [t.id, t]));

export const getToolDefinition = (toolId: string) => toolRegistry[toolId];
export const listToolDefinitions = () => Object.values(toolRegistry);
export const getPublicToolDefinitions = () => premiumToolDefinitions.filter((t) => !isPublicToolHidden(t.id));
export const getFeaturedToolDefinitions = () => getPublicToolDefinitions().filter((t) => t.metadata.featured);
export const getTrendingToolDefinitions = () => getPublicToolDefinitions().filter((t) => t.metadata.trending);
export const getToolsByCategory = (category: string) =>
  getPublicToolDefinitions().filter((t) => t.metadata.category === category);
export const getPricingForTool = (toolId: string): ToolPricingInfo | undefined => {
  const t = getToolDefinition(toolId);
  return t ? { toolId: t.id, creditCost: t.creditCost, usageClass: t.usageClass } : undefined;
};
export const renderToolOutput = (toolId: string, response: string): ToolExecutionResult => {
  const t = getToolDefinition(toolId);
  return t ? (t.outputFormatter(response) as ToolExecutionResult) : { raw: response };
};
export const getToolPrompt = (toolId: string, input: ToolExecutionContext): string => {
  const t = getToolDefinition(toolId);
  return t ? t.promptTemplate(input) : "";
};
