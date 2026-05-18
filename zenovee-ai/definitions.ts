import { z } from "zod";
import type { ToolDefinition } from "@/types/tools";

function parseJsonResponse<T>(response: string): T {
  const normalized = response.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(normalized) as T;
}

const seoArticleInput = z.object({
  targetKeyword: z.string().min(2),
  audience: z.string().min(2),
  tone: z.string().min(2),
  articleLength: z.string().min(2),
  niche: z.string().min(2),
  competitorUrl: z.string().url().optional().or(z.literal("")),
});

const seoArticleOutput = z.object({
  seoTitle: z.string(),
  metaDescription: z.string(),
  searchIntent: z.string(),
  keywordClusters: z.array(z.string()),
  articleOutline: z.array(z.string()),
  fullArticle: z.string(),
  faqSection: z.array(z.object({ question: z.string(), answer: z.string() })),
  internalLinkSuggestions: z.array(z.string()),
});

const adCopyInput = z.object({
  productService: z.string().min(2),
  audience: z.string().min(2),
  platform: z.string().min(2),
  offer: z.string().min(2),
  tone: z.string().min(2),
});

const adCopyOutput = z.object({
  headlines: z.array(z.string()).length(10),
  primaryTexts: z.array(z.string()).length(5),
  ctaOptions: z.array(z.string()).length(5),
  adVariations: z.array(z.object({ headline: z.string(), body: z.string(), cta: z.string() })).length(3),
  angleExplanation: z.array(z.string()),
});

const personaInput = z.object({
  businessDescription: z.string().min(10),
  niche: z.string().min(2),
  targetMarket: z.string().min(2),
  priceRange: z.string().min(2),
});

const personaOutput = z.object({
  buyerPersona: z.string(),
  demographics: z.array(z.string()),
  painPoints: z.array(z.string()),
  goals: z.array(z.string()),
  objections: z.array(z.string()),
  buyingTriggers: z.array(z.string()),
  contentIdeas: z.array(z.string()),
  messagingAngles: z.array(z.string()),
});

const bgInput = z.object({ imageName: z.string().min(1, "Image is required") });
const bgOutput = z.object({ status: z.string(), message: z.string() });

const landingInput = z.object({
  productName: z.string().min(2),
  targetAudience: z.string().min(2),
  coreProblem: z.string().min(2),
  mainBenefit: z.string().min(2),
  tone: z.string().min(2),
});

const landingOutput = z.object({
  heroHeadline: z.string(),
  subheadline: z.string(),
  ctaButtons: z.array(z.string()),
  problemSection: z.array(z.string()),
  solutionSection: z.array(z.string()),
  benefits: z.array(z.string()),
  testimonialsSuggestions: z.array(z.string()),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  finalCta: z.string(),
});

const browserContextInput = z.object({
  selectedText: z.string().min(4),
  pageTitle: z.string().optional().default(""),
  pageUrl: z.string().url().optional().or(z.literal("")),
  pageContext: z.string().optional().default(""),
  tone: z.string().optional().default("Professional"),
  audience: z.string().optional().default("General audience"),
  objective: z.string().optional().default(""),
  platform: z.string().optional().default("Web"),
});

const browserTextOutput = z.object({
  result: z.string(),
  title: z.string(),
  suggestions: z.array(z.string()),
});

const browserSeoOutput = z.object({
  result: z.string(),
  title: z.string(),
  suggestions: z.array(z.string()),
});

const browserAdCopyOutput = z.object({
  result: z.string(),
  title: z.string(),
  suggestions: z.array(z.string()),
});

export const toolRegistry: Record<string, ToolDefinition> = {
  "seo-article-generator": {
    id: "seo-article-generator",
    metadata: { name: "AI SEO Article Generator", description: "Long-form SEO article system with strategy layers.", category: "SEO", icon: "📝", availability: "active" },
    fields: [
      { name: "targetKeyword", label: "Target Keyword", type: "text", placeholder: "best crm software for startups", required: true },
      { name: "audience", label: "Audience", type: "text", placeholder: "B2B SaaS founders", required: true },
      { name: "tone", label: "Tone", type: "select", required: true, options: [{ label: "Professional", value: "Professional" }, { label: "Authoritative", value: "Authoritative" }, { label: "Friendly", value: "Friendly" }] },
      { name: "articleLength", label: "Article Length", type: "select", required: true, options: [{ label: "1200-1500 words", value: "1200-1500 words" }, { label: "1500-2000 words", value: "1500-2000 words" }, { label: "2000+ words", value: "2000+ words" }] },
      { name: "niche", label: "Business / Niche", type: "text", placeholder: "SaaS sales enablement", required: true },
      { name: "competitorUrl", label: "Competitor URL (optional)", type: "text", placeholder: "https://example.com/article" },
    ],
    inputSchema: seoArticleInput,
    outputSchema: seoArticleOutput,
    creditCost: 35,
    usageClass: "heavy",
    aiModel: "llama-3.1-70b-versatile",
    exportFormats: ["md", "pdf", "txt", "json"],
    promptTemplate: (i: z.infer<typeof seoArticleInput>) => `Return ONLY JSON matching this exact structure keys: seoTitle, metaDescription, searchIntent, keywordClusters[], articleOutline[], fullArticle, faqSection[{question,answer}], internalLinkSuggestions[].\nCreate premium SEO content for keyword ${i.targetKeyword}, audience ${i.audience}, tone ${i.tone}, length ${i.articleLength}, niche ${i.niche}, competitor URL ${i.competitorUrl || "N/A"}.`,
    outputFormatter: (r) => parseJsonResponse<z.infer<typeof seoArticleOutput>>(r),
  },
  "ad-copy-generator": {
    id: "ad-copy-generator",
    metadata: { name: "AI Ad Copy Generator", description: "Multi-angle ad pack built for paid campaigns.", category: "Marketing", icon: "📣", availability: "active" },
    fields: [
      { name: "productService", label: "Product / Service", type: "text", placeholder: "AI meeting assistant", required: true },
      { name: "audience", label: "Audience", type: "text", placeholder: "Remote startup teams", required: true },
      { name: "platform", label: "Platform", type: "select", required: true, options: [{ label: "Meta", value: "Meta" }, { label: "Google", value: "Google" }, { label: "LinkedIn", value: "LinkedIn" }, { label: "X", value: "X" }] },
      { name: "offer", label: "Offer", type: "text", placeholder: "14-day starter access", required: true },
      { name: "tone", label: "Tone", type: "select", required: true, options: [{ label: "Bold", value: "Bold" }, { label: "Professional", value: "Professional" }, { label: "Conversational", value: "Conversational" }] },
    ],
    inputSchema: adCopyInput,
    outputSchema: adCopyOutput,
    creditCost: 20,
    usageClass: "standard",
    aiModel: "llama-3.1-70b-versatile",
    exportFormats: ["txt", "json"],
    promptTemplate: (i: z.infer<typeof adCopyInput>) => `Return ONLY JSON with keys headlines[10], primaryTexts[5], ctaOptions[5], adVariations[3]{headline,body,cta}, angleExplanation[]. Create premium direct-response copy for ${i.platform}. Product: ${i.productService}. Audience: ${i.audience}. Offer: ${i.offer}. Tone: ${i.tone}.`,
    outputFormatter: (r) => parseJsonResponse<z.infer<typeof adCopyOutput>>(r),
  },
  "customer-persona-builder": {
    id: "customer-persona-builder",
    metadata: { name: "AI Customer Persona Builder", description: "Buyer-intelligence profile for conversion messaging.", category: "Strategy", icon: "🧠", availability: "active" },
    fields: [
      { name: "businessDescription", label: "Website / Business Description", type: "textarea", placeholder: "We sell cybersecurity training for SMB teams...", required: true },
      { name: "niche", label: "Niche", type: "text", placeholder: "Cybersecurity education", required: true },
      { name: "targetMarket", label: "Target Market", type: "text", placeholder: "US-based SMB owners", required: true },
      { name: "priceRange", label: "Price Range", type: "text", placeholder: "$99 - $499", required: true },
    ],
    inputSchema: personaInput,
    outputSchema: personaOutput,
    creditCost: 25,
    usageClass: "standard",
    aiModel: "llama-3.1-70b-versatile",
    exportFormats: ["pdf", "md", "txt", "json"],
    promptTemplate: (i: z.infer<typeof personaInput>) => `Return ONLY JSON with keys buyerPersona, demographics[], painPoints[], goals[], objections[], buyingTriggers[], contentIdeas[], messagingAngles[]. Business: ${i.businessDescription}. Niche: ${i.niche}. Market: ${i.targetMarket}. Price: ${i.priceRange}.`,
    outputFormatter: (r) => parseJsonResponse<z.infer<typeof personaOutput>>(r),
  },
  "background-remover": {
    id: "background-remover",
    metadata: { name: "AI Background Remover", description: "Image background removal is temporarily unavailable.", category: "Design", icon: "🖼️", availability: "coming_soon", disabledReason: "Coming soon" },
    fields: [{ name: "imageName", label: "Image Upload", type: "file", required: true }],
    inputSchema: bgInput,
    outputSchema: bgOutput,
    creditCost: 0,
    usageClass: "standard",
    aiModel: "llama-3.1-8b-instant",
    exportFormats: ["png"],
    promptTemplate: () => "",
    outputFormatter: () => ({ status: "coming_soon", message: "Background remover is coming soon." }),
  },
  "landing-page-copy-generator": {
    id: "landing-page-copy-generator",
    metadata: { name: "AI Landing Page Copy Generator", description: "Conversion-first landing page copy system.", category: "Copywriting", icon: "🚀", availability: "active" },
    fields: [
      { name: "productName", label: "Product Name", type: "text", placeholder: "ZenPilot CRM", required: true },
      { name: "targetAudience", label: "Target Audience", type: "text", placeholder: "Freelance consultants", required: true },
      { name: "coreProblem", label: "Core Problem", type: "text", placeholder: "Losing leads due to messy follow-up", required: true },
      { name: "mainBenefit", label: "Main Benefit", type: "text", placeholder: "Close more clients in less time", required: true },
      { name: "tone", label: "Tone", type: "select", required: true, options: [{ label: "Professional", value: "Professional" }, { label: "Bold", value: "Bold" }, { label: "Friendly", value: "Friendly" }] },
    ],
    inputSchema: landingInput,
    outputSchema: landingOutput,
    creditCost: 25,
    usageClass: "heavy",
    aiModel: "llama-3.1-70b-versatile",
    exportFormats: ["md", "pdf", "txt", "json"],
    promptTemplate: (i: z.infer<typeof landingInput>) => `Return ONLY JSON with keys heroHeadline, subheadline, ctaButtons[], problemSection[], solutionSection[], benefits[], testimonialsSuggestions[], faq[{question,answer}], finalCta. Product ${i.productName}, audience ${i.targetAudience}, problem ${i.coreProblem}, benefit ${i.mainBenefit}, tone ${i.tone}.`,
    outputFormatter: (r) => parseJsonResponse<z.infer<typeof landingOutput>>(r),
  },
  "browser-rewrite": {
    id: "browser-rewrite",
    metadata: { name: "Rewrite Text", description: "Rewrite selected content with page-aware context.", category: "Browser", icon: "✍️", availability: "active" },
    fields: [],
    inputSchema: browserContextInput,
    outputSchema: browserTextOutput,
    creditCost: 8,
    usageClass: "standard",
    aiModel: "llama-3.1-70b-versatile",
    exportFormats: ["txt", "json"],
    promptTemplate: (i: z.infer<typeof browserContextInput>) => `Return ONLY JSON with keys title, result, suggestions[]. Rewrite the selected text for clarity and polish. Tone: ${i.tone}. Page title: ${i.pageTitle}. Page URL: ${i.pageUrl || "N/A"}. Page context: ${i.pageContext || "N/A"}. Selected text: ${i.selectedText}`,
    outputFormatter: (r) => parseJsonResponse<z.infer<typeof browserTextOutput>>(r),
  },
  "browser-summarize": {
    id: "browser-summarize",
    metadata: { name: "Summarize Content", description: "Condense selected content into high-signal summaries.", category: "Browser", icon: "🧾", availability: "active" },
    fields: [],
    inputSchema: browserContextInput,
    outputSchema: browserTextOutput,
    creditCost: 7,
    usageClass: "standard",
    aiModel: "llama-3.1-8b-instant",
    exportFormats: ["txt", "json"],
    promptTemplate: (i: z.infer<typeof browserContextInput>) => `Return ONLY JSON with keys title, result, suggestions[]. Summarize the selected text into a concise professional brief with key takeaways. Page title: ${i.pageTitle}. Page URL: ${i.pageUrl || "N/A"}. Page context: ${i.pageContext || "N/A"}. Selected text: ${i.selectedText}`,
    outputFormatter: (r) => parseJsonResponse<z.infer<typeof browserTextOutput>>(r),
  },
  "browser-improve-writing": {
    id: "browser-improve-writing",
    metadata: { name: "Improve Writing", description: "Strengthen tone, structure, and readability instantly.", category: "Browser", icon: "✨", availability: "active" },
    fields: [],
    inputSchema: browserContextInput,
    outputSchema: browserTextOutput,
    creditCost: 8,
    usageClass: "standard",
    aiModel: "llama-3.1-70b-versatile",
    exportFormats: ["txt", "json"],
    promptTemplate: (i: z.infer<typeof browserContextInput>) => `Return ONLY JSON with keys title, result, suggestions[]. Improve the writing quality, rhythm, grammar, and persuasiveness without changing intent. Tone: ${i.tone}. Audience: ${i.audience}. Page title: ${i.pageTitle}. Page URL: ${i.pageUrl || "N/A"}. Page context: ${i.pageContext || "N/A"}. Selected text: ${i.selectedText}`,
    outputFormatter: (r) => parseJsonResponse<z.infer<typeof browserTextOutput>>(r),
  },
  "browser-seo-helper": {
    id: "browser-seo-helper",
    metadata: { name: "SEO Helper", description: "Generate SEO improvements from the current page context.", category: "Browser", icon: "🔎", availability: "active" },
    fields: [],
    inputSchema: browserContextInput,
    outputSchema: browserSeoOutput,
    creditCost: 10,
    usageClass: "standard",
    aiModel: "llama-3.1-70b-versatile",
    exportFormats: ["txt", "json"],
    promptTemplate: (i: z.infer<typeof browserContextInput>) => `Return ONLY JSON with keys title, result, suggestions[]. Act as a senior SEO strategist. Analyze the selected text and page context, then provide optimized copy plus SEO recommendations. Objective: ${i.objective || "Improve organic performance"}. Page title: ${i.pageTitle}. Page URL: ${i.pageUrl || "N/A"}. Page context: ${i.pageContext || "N/A"}. Selected text: ${i.selectedText}`,
    outputFormatter: (r) => parseJsonResponse<z.infer<typeof browserSeoOutput>>(r),
  },
  "browser-ad-copy": {
    id: "browser-ad-copy",
    metadata: { name: "Ad Copy", description: "Create platform-ready ad copy from page content and selections.", category: "Browser", icon: "📣", availability: "active" },
    fields: [],
    inputSchema: browserContextInput,
    outputSchema: browserAdCopyOutput,
    creditCost: 12,
    usageClass: "standard",
    aiModel: "llama-3.1-70b-versatile",
    exportFormats: ["txt", "json"],
    promptTemplate: (i: z.infer<typeof browserContextInput>) => `Return ONLY JSON with keys title, result, suggestions[]. Create premium ad copy variations for ${i.platform}. Audience: ${i.audience}. Objective: ${i.objective || "Drive conversions"}. Page title: ${i.pageTitle}. Page URL: ${i.pageUrl || "N/A"}. Page context: ${i.pageContext || "N/A"}. Selected text: ${i.selectedText}`,
    outputFormatter: (r) => parseJsonResponse<z.infer<typeof browserAdCopyOutput>>(r),
  },
};

export const getToolDefinition = (toolId: string): ToolDefinition | undefined => toolRegistry[toolId];
export const listToolDefinitions = () => Object.values(toolRegistry);
