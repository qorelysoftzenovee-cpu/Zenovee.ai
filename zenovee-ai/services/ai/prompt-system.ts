import { z } from "zod";
import type { AIModel } from "@/services/ai/types";

export const OUTPUT_LENGTHS = ["short", "medium", "long"] as const;
export const GENERATION_MODES = ["generate", "regenerate", "improve", "shorten", "expand"] as const;

export type OutputLength = (typeof OUTPUT_LENGTHS)[number];
export type GenerationMode = (typeof GENERATION_MODES)[number];

export const promptRuntimeControlsSchema = z.object({
  tone: z.string().trim().min(2).max(80).optional(),
  writingStyle: z.string().trim().min(2).max(80).optional(),
  outputLength: z.enum(OUTPUT_LENGTHS).optional(),
  language: z.string().trim().min(2).max(40).optional(),
  customInstructions: z.string().trim().max(600).optional(),
});

export const generationExecutionOptionsSchema = z.object({
  mode: z.enum(GENERATION_MODES).default("generate"),
  controls: promptRuntimeControlsSchema.default({}),
  previousOutput: z.record(z.string(), z.unknown()).optional(),
});

export const toolPromptAdminOverridesSchema = z.object({
  modelOverride: z.enum(["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b"] satisfies readonly AIModel[]).optional(),
  systemPromptAppend: z.string().max(4000).optional().default(""),
  userPromptAppend: z.string().max(4000).optional().default(""),
  defaultTone: z.string().trim().max(80).optional().default(""),
  defaultWritingStyle: z.string().trim().max(80).optional().default(""),
  defaultOutputLength: z.enum(OUTPUT_LENGTHS).optional(),
  defaultLanguage: z.string().trim().max(40).optional().default(""),
  maxValidationRetries: z.number().int().min(0).max(3).optional().default(2),
});

export type PromptRuntimeControls = z.infer<typeof promptRuntimeControlsSchema>;
export type GenerationExecutionOptions = z.infer<typeof generationExecutionOptionsSchema>;
export type ToolPromptAdminOverrides = z.infer<typeof toolPromptAdminOverridesSchema>;

export type ResolvedPromptControls = {
  tone: string;
  writingStyle: string;
  outputLength: OutputLength;
  language: string;
  customInstructions?: string;
};

export type PromptControlCatalog = {
  tones: string[];
  writingStyles: string[];
  languages: string[];
  outputLengths: OutputLength[];
  supportedModes: GenerationMode[];
  defaults: Omit<ResolvedPromptControls, "customInstructions">;
  customInstructionsEnabled: boolean;
};

export type PromptBuildContext = {
  input: Record<string, unknown>;
  controls: ResolvedPromptControls;
  mode: GenerationMode;
  previousOutput?: Record<string, unknown>;
  repairHint?: string;
};

export type ToolPromptProfile = {
  toolId: string;
  version: string;
  category: string;
  objective: string;
  complexity: "light" | "standard" | "heavy";
  outputSections: string[];
  formattingRules: string[];
  qualityChecklist: string[];
  controls: PromptControlCatalog;
  systemPrompt: string;
  userPrompt: (context: PromptBuildContext) => string;
};

const DEFAULT_LANGUAGES = ["English", "Hindi", "Spanish", "French", "German"];
const DEFAULT_OUTPUT_LENGTHS = [...OUTPUT_LENGTHS];

function sentenceCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatInputSummary(input: Record<string, unknown>) {
  return Object.entries(input)
    .map(([key, value]) => `- ${sentenceCase(key)}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join("\n");
}

function defaultPromptCatalog(overrides: Partial<PromptControlCatalog> = {}): PromptControlCatalog {
  return {
    tones: ["Professional", "Authoritative", "Friendly", "Bold", "Conversational"],
    writingStyles: ["Publish-ready", "Editorial", "Conversion-focused", "Analytical", "Concise"],
    languages: DEFAULT_LANGUAGES,
    outputLengths: DEFAULT_OUTPUT_LENGTHS,
    supportedModes: ["generate", "regenerate", "improve", "shorten", "expand"],
    defaults: {
      tone: "Professional",
      writingStyle: "Publish-ready",
      outputLength: "medium",
      language: "English",
    },
    customInstructionsEnabled: true,
    ...overrides,
  };
}

const browserPromptCatalog = defaultPromptCatalog({
  writingStyles: ["Professional", "Concise", "Clear", "Persuasive"],
  outputLengths: ["short", "medium"],
  defaults: {
    tone: "Professional",
    writingStyle: "Clear",
    outputLength: "medium",
    language: "English",
  },
});

const categoryPromptProfiles: Record<string, ToolPromptProfile> = {
  "Executive Branding": {
    toolId: "executive-branding@category",
    version: "executive-branding@1",
    category: "Executive Branding",
    objective: "Create premium executive positioning, thought-leadership, and authority-building narrative outputs.",
    complexity: "heavy",
    outputSections: ["strategic hook", "hook analysis", "storytelling structure", "authority angles", "audience psychology triggers", "engagement score", "final draft"],
    formattingRules: [
      "Keep the writing sharp, publishable, and founder/executive credible.",
      "Prefer strategic clarity over generic motivational language.",
      "Make the final draft sound premium, trusted, and audience-aware.",
    ],
    qualityChecklist: [
      "Strategic hook must feel distinct and high-signal.",
      "Authority angles should be useful for real positioning.",
      "Final draft should feel polished enough to publish with light edits.",
    ],
    controls: defaultPromptCatalog({
      defaults: {
        tone: "Authoritative",
        writingStyle: "Editorial",
        outputLength: "medium",
        language: "English",
      },
    }),
    systemPrompt: "You are Zenovee's executive branding strategist. Produce premium authority content systems for founders, executives, and consultants.",
    userPrompt: ({ input, controls, mode, previousOutput, repairHint }) => [
      `Task mode: ${mode}.`,
      `Build executive-branding output using tone ${controls.tone}, style ${controls.writingStyle}, output length ${controls.outputLength}, language ${controls.language}.`,
      "Strategic brief:",
      formatInputSummary(input),
      previousOutput ? `Existing draft to refine:\n${JSON.stringify(previousOutput)}` : "",
      repairHint ? `Revision notes: ${repairHint}` : "",
    ].filter(Boolean).join("\n\n"),
  },
  "B2B Sales": {
    toolId: "b2b-sales@category",
    version: "b2b-sales@1",
    category: "B2B Sales",
    objective: "Create premium B2B sales messaging systems with stronger ICP fit, objection handling, and conversion readiness.",
    complexity: "standard",
    outputSections: ["ICP alignment score", "objection handling frames", "buyer psychology levers", "concise pitch", "enterprise framing", "CTA score", "conversion sequence"],
    formattingRules: [
      "Keep copy enterprise-aware, concise, and commercially useful.",
      "Avoid hype or generic prospecting clichés.",
      "Output should feel deployment-ready for serious B2B teams.",
    ],
    qualityChecklist: [
      "Objection handling must feel realistic and persuasive.",
      "Concise pitch should be easy to reuse in outreach or sales calls.",
      "Conversion sequence should demonstrate progression, not repetition.",
    ],
    controls: defaultPromptCatalog({
      defaults: {
        tone: "Professional",
        writingStyle: "Conversion-focused",
        outputLength: "medium",
        language: "English",
      },
    }),
    systemPrompt: "You are Zenovee's B2B revenue strategist. Produce premium outbound and sales-conversion systems for operators selling to serious buyers.",
    userPrompt: ({ input, controls, mode, previousOutput, repairHint }) => [
      `Task mode: ${mode}.`,
      `Generate B2B sales output with tone ${controls.tone}, style ${controls.writingStyle}, output length ${controls.outputLength}, language ${controls.language}.`,
      "Sales brief:",
      formatInputSummary(input),
      previousOutput ? `Existing sales output to improve:\n${JSON.stringify(previousOutput)}` : "",
      repairHint ? `Revision notes: ${repairHint}` : "",
    ].filter(Boolean).join("\n\n"),
  },
  "Conversion Copywriting": {
    toolId: "conversion-copy@category",
    version: "conversion-copy@1",
    category: "Conversion Copywriting",
    objective: "Create conversion-oriented messaging systems with clear frameworks, angles, triggers, and CTA structure.",
    complexity: "heavy",
    outputSections: ["framework blocks", "emotional triggers", "conversion angles", "CTA hierarchy", "scroll-stopping hooks", "final copy"],
    formattingRules: [
      "Write commercially useful copy, not generic brainstorming notes.",
      "Maintain tight narrative flow and distinct conversion angles.",
      "Final copy must feel polished and ready for page/campaign adaptation.",
    ],
    qualityChecklist: [
      "Framework blocks should show real message progression.",
      "Hooks and CTA hierarchy should feel distinct and testable.",
      "Final copy should feel premium, persuasive, and clear.",
    ],
    controls: defaultPromptCatalog({
      defaults: {
        tone: "Bold",
        writingStyle: "Conversion-focused",
        outputLength: "long",
        language: "English",
      },
    }),
    systemPrompt: "You are Zenovee's premium conversion copy strategist. Produce persuasive copy systems with sharper structure, stronger psychology, and higher deployment quality.",
    userPrompt: ({ input, controls, mode, previousOutput, repairHint }) => [
      `Task mode: ${mode}.`,
      `Generate conversion-copy output using tone ${controls.tone}, style ${controls.writingStyle}, output length ${controls.outputLength}, language ${controls.language}.`,
      "Copy brief:",
      formatInputSummary(input),
      previousOutput ? `Existing copy pack to refine:\n${JSON.stringify(previousOutput)}` : "",
      repairHint ? `Revision notes: ${repairHint}` : "",
    ].filter(Boolean).join("\n\n"),
  },
  "SEO & Authority": {
    toolId: "seo-authority@category",
    version: "seo-authority@1",
    category: "SEO & Authority",
    objective: "Create structured SEO growth outputs such as intent maps, clusters, metadata, FAQs, and authority architecture.",
    complexity: "heavy",
    outputSections: ["intent analysis", "semantic clusters", "topical authority map", "metadata", "FAQ blocks", "internal linking plan", "content structure"],
    formattingRules: [
      "Favor search intent clarity and strategic topical coverage.",
      "Outputs should help teams move directly into SEO execution.",
      "Avoid shallow, generic keyword advice.",
    ],
    qualityChecklist: [
      "Clusters should be grouped meaningfully, not randomly expanded.",
      "Metadata should be specific and search-ready.",
      "Internal linking and structure should feel operationally useful.",
    ],
    controls: defaultPromptCatalog({
      defaults: {
        tone: "Authoritative",
        writingStyle: "Analytical",
        outputLength: "long",
        language: "English",
      },
    }),
    systemPrompt: "You are Zenovee's SEO authority strategist. Produce premium search-growth systems with clear structure, intent coverage, and execution usefulness.",
    userPrompt: ({ input, controls, mode, previousOutput, repairHint }) => [
      `Task mode: ${mode}.`,
      `Generate SEO authority output using tone ${controls.tone}, style ${controls.writingStyle}, output length ${controls.outputLength}, language ${controls.language}.`,
      "SEO brief:",
      formatInputSummary(input),
      previousOutput ? `Existing SEO output to refine:\n${JSON.stringify(previousOutput)}` : "",
      repairHint ? `Revision notes: ${repairHint}` : "",
    ].filter(Boolean).join("\n\n"),
  },
  "Premium Image/Brand Assets": {
    toolId: "premium-assets@category",
    version: "premium-assets@1",
    category: "Premium Image/Brand Assets",
    objective: "Create premium creative direction outputs with master prompts, composition rules, lighting, and brand-consistent visual guidance.",
    complexity: "standard",
    outputSections: ["master prompt", "composition instructions", "lighting instructions", "camera style direction", "premium aesthetic rules", "variations"],
    formattingRules: [
      "Keep instructions precise enough for real image-generation or art-direction use.",
      "Maintain a premium aesthetic with visual consistency.",
      "Variations should be distinct, not repetitive rewordings.",
    ],
    qualityChecklist: [
      "Master prompt should be robust and visually specific.",
      "Aesthetic rules should reinforce consistency.",
      "Variations should feel usable for campaign iteration.",
    ],
    controls: defaultPromptCatalog({
      defaults: {
        tone: "Professional",
        writingStyle: "Concise",
        outputLength: "medium",
        language: "English",
      },
    }),
    systemPrompt: "You are Zenovee's premium visual direction strategist. Produce polished creative prompts and brand-safe art-direction systems for marketing assets.",
    userPrompt: ({ input, controls, mode, previousOutput, repairHint }) => [
      `Task mode: ${mode}.`,
      `Generate premium visual direction output using tone ${controls.tone}, style ${controls.writingStyle}, output length ${controls.outputLength}, language ${controls.language}.`,
      "Creative brief:",
      formatInputSummary(input),
      previousOutput ? `Existing visual direction to refine:\n${JSON.stringify(previousOutput)}` : "",
      repairHint ? `Revision notes: ${repairHint}` : "",
    ].filter(Boolean).join("\n\n"),
  },
  "Browser Tools": {
    toolId: "browser-tools@category",
    version: "browser-tools@1",
    category: "Browser Tools",
    objective: "Assist live page workflows with concise, context-aware browser outputs.",
    complexity: "light",
    outputSections: ["result", "suggestions"],
    formattingRules: [
      "Be concise, practical, and page-context aware.",
      "Avoid filler and preserve user intent.",
    ],
    qualityChecklist: [
      "Primary result should be directly usable.",
      "Suggestions should be actionable and relevant.",
    ],
    controls: browserPromptCatalog,
    systemPrompt: "You are Zenovee's browser productivity assistant. Produce concise, useful, context-aware results for in-page workflows.",
    userPrompt: ({ input, controls, mode, previousOutput, repairHint }) => [
      `Task mode: ${mode}.`,
      `Generate browser-tool output using tone ${controls.tone}, style ${controls.writingStyle}, output length ${controls.outputLength}, language ${controls.language}.`,
      "Page context:",
      formatInputSummary(input),
      previousOutput ? `Existing browser-tool output to refine:\n${JSON.stringify(previousOutput)}` : "",
      repairHint ? `Revision notes: ${repairHint}` : "",
    ].filter(Boolean).join("\n\n"),
  },
};

const toolPromptProfiles: Record<string, ToolPromptProfile> = {
  "seo-article-generator": {
    toolId: "seo-article-generator",
    version: "seo-article-generator@2",
    category: "SEO content",
    objective: "Create premium, structured, search-intent aligned SEO article packages.",
    complexity: "heavy",
    outputSections: ["title", "meta description", "search intent", "keyword clusters", "outline", "article", "FAQs", "internal links"],
    formattingRules: [
      "Every section must be specific, strategic, and publish-ready.",
      "Use concrete subheadings instead of generic placeholders.",
      "Write for clarity, authority, and organic conversion potential.",
    ],
    qualityChecklist: [
      "Match the likely search intent behind the target keyword.",
      "Ensure the article body is detailed and commercially useful.",
      "Include actionable FAQ answers and relevant internal links.",
    ],
    controls: defaultPromptCatalog({
      defaults: {
        tone: "Authoritative",
        writingStyle: "Editorial",
        outputLength: "long",
        language: "English",
      },
    }),
    systemPrompt: "You are Zenovee's senior SEO editorial strategist. Produce premium, search-optimized content frameworks that feel professionally researched, commercially aware, and ready for publication.",
    userPrompt: ({ input, controls, mode, previousOutput, repairHint }) => [
      `Task mode: ${mode}.`,
      `Create a premium SEO article package using these delivery settings: tone ${controls.tone}, writing style ${controls.writingStyle}, output length ${controls.outputLength}, language ${controls.language}.`,
      "Source brief:",
      formatInputSummary(input),
      previousOutput ? `Current version to refine:\n${JSON.stringify(previousOutput)}` : "",
      repairHint ? `Revision notes: ${repairHint}` : "",
    ].filter(Boolean).join("\n\n"),
  },
  "ad-copy-generator": {
    toolId: "ad-copy-generator",
    version: "ad-copy-generator@2",
    category: "Advertising copy",
    objective: "Create high-performing ad copy systems with multiple emotional and strategic angles.",
    complexity: "standard",
    outputSections: ["headlines", "primary text", "CTA variations", "ad variations", "angle explanations"],
    formattingRules: [
      "Make the hooks distinct from each other.",
      "Keep copy usable for campaign deployment, not generic brainstorming.",
      "Balance clarity, persuasion, and relevance to platform context.",
    ],
    qualityChecklist: [
      "Headlines should have different hooks, not slight rewrites.",
      "Primary texts should show different emotional angles or positioning strategies.",
      "CTAs must sound natural for paid campaigns.",
    ],
    controls: defaultPromptCatalog({
      defaults: {
        tone: "Bold",
        writingStyle: "Conversion-focused",
        outputLength: "medium",
        language: "English",
      },
    }),
    systemPrompt: "You are Zenovee's direct-response advertising strategist. Produce premium paid-media copy with clear hooks, angles, CTA logic, and campaign readiness.",
    userPrompt: ({ input, controls, mode, previousOutput, repairHint }) => [
      `Task mode: ${mode}.`,
      `Generate premium ad copy with tone ${controls.tone}, style ${controls.writingStyle}, length ${controls.outputLength}, language ${controls.language}.`,
      "Campaign brief:",
      formatInputSummary(input),
      previousOutput ? `Previous copy pack to improve or transform:\n${JSON.stringify(previousOutput)}` : "",
      repairHint ? `Revision notes: ${repairHint}` : "",
    ].filter(Boolean).join("\n\n"),
  },
  "customer-persona-builder": {
    toolId: "customer-persona-builder",
    version: "customer-persona-builder@2",
    category: "Persona research",
    objective: "Transform business context into a nuanced, actionable customer persona system.",
    complexity: "standard",
    outputSections: ["persona summary", "demographics", "pain points", "objections", "motivations", "buying triggers", "content ideas", "messaging angles"],
    formattingRules: [
      "Avoid vague market-research clichés.",
      "Make the persona feel commercially useful for messaging and funnel decisions.",
      "Keep the output practical for sales, content, and ad teams.",
    ],
    qualityChecklist: [
      "Include realistic pain points and motivations.",
      "Surface objections and buying triggers that inform conversion strategy.",
      "Keep the persona aligned to the pricing context and target market.",
    ],
    controls: defaultPromptCatalog({
      defaults: {
        tone: "Professional",
        writingStyle: "Analytical",
        outputLength: "medium",
        language: "English",
      },
    }),
    systemPrompt: "You are Zenovee's audience intelligence strategist. Produce credible persona frameworks that feel grounded in buyer behavior, conversion psychology, and practical marketing use.",
    userPrompt: ({ input, controls, mode, previousOutput, repairHint }) => [
      `Task mode: ${mode}.`,
      `Build a premium buyer persona using tone ${controls.tone}, style ${controls.writingStyle}, output length ${controls.outputLength}, language ${controls.language}.`,
      "Business context:",
      formatInputSummary(input),
      previousOutput ? `Existing persona to improve or expand:\n${JSON.stringify(previousOutput)}` : "",
      repairHint ? `Revision notes: ${repairHint}` : "",
    ].filter(Boolean).join("\n\n"),
  },
  "landing-page-copy-generator": {
    toolId: "landing-page-copy-generator",
    version: "landing-page-copy-generator@2",
    category: "Landing page copy",
    objective: "Create conversion-first landing page copy frameworks with premium structure and clarity.",
    complexity: "heavy",
    outputSections: ["hero", "CTA stack", "problem section", "solution section", "benefits", "testimonials", "FAQ", "final CTA"],
    formattingRules: [
      "Keep the copy persuasive, specific, and easy to scan.",
      "Maintain narrative flow from problem to solution to conversion.",
      "Write polished copy that can be adapted into a live landing page.",
    ],
    qualityChecklist: [
      "Hero should express a clear promise.",
      "Benefits should be concrete and non-repetitive.",
      "FAQs should reduce purchase friction.",
    ],
    controls: defaultPromptCatalog({
      defaults: {
        tone: "Professional",
        writingStyle: "Conversion-focused",
        outputLength: "long",
        language: "English",
      },
    }),
    systemPrompt: "You are Zenovee's conversion copy strategist. Produce premium landing page copy packages that are persuasive, structured, and ready for design handoff.",
    userPrompt: ({ input, controls, mode, previousOutput, repairHint }) => [
      `Task mode: ${mode}.`,
      `Create premium landing page copy with tone ${controls.tone}, style ${controls.writingStyle}, length ${controls.outputLength}, language ${controls.language}.`,
      "Conversion brief:",
      formatInputSummary(input),
      previousOutput ? `Existing landing-page output to refine:\n${JSON.stringify(previousOutput)}` : "",
      repairHint ? `Revision notes: ${repairHint}` : "",
    ].filter(Boolean).join("\n\n"),
  },
  "browser-rewrite": {
    toolId: "browser-rewrite",
    version: "browser-rewrite@2",
    category: "Browser writing assistant",
    objective: "Rewrite selected text with better clarity, flow, and polish while preserving intent.",
    complexity: "standard",
    outputSections: ["title", "rewritten result", "suggestions"],
    formattingRules: [
      "Preserve the original core meaning.",
      "Improve clarity and readability without becoming generic.",
      "Use the page context when it meaningfully improves the rewrite.",
    ],
    qualityChecklist: [
      "The rewrite should be cleaner than the original.",
      "Suggestions should be actionable and concise.",
    ],
    controls: browserPromptCatalog,
    systemPrompt: "You are Zenovee's in-browser writing assistant. Produce clean, professional rewrites that preserve intent and improve usefulness.",
    userPrompt: ({ input, controls, mode, previousOutput, repairHint }) => [
      `Task mode: ${mode}.`,
      `Rewrite the supplied text with tone ${controls.tone}, style ${controls.writingStyle}, length ${controls.outputLength}, language ${controls.language}.`,
      "Context:",
      formatInputSummary(input),
      previousOutput ? `Existing output to improve or transform:\n${JSON.stringify(previousOutput)}` : "",
      repairHint ? `Revision notes: ${repairHint}` : "",
    ].filter(Boolean).join("\n\n"),
  },
  "browser-summarize": {
    toolId: "browser-summarize",
    version: "browser-summarize@2",
    category: "Browser summary assistant",
    objective: "Condense selected text into high-signal summaries with clear next-step suggestions.",
    complexity: "light",
    outputSections: ["title", "summary", "suggestions"],
    formattingRules: [
      "Prioritize signal over filler.",
      "Keep summaries easy to scan and use immediately.",
      "Suggestions should point to next actions or insights.",
    ],
    qualityChecklist: [
      "Summary should capture the core point quickly.",
      "Suggestions should feel relevant to the selected content.",
    ],
    controls: browserPromptCatalog,
    systemPrompt: "You are Zenovee's executive summarization assistant. Turn dense content into concise, high-value briefs without losing essential meaning.",
    userPrompt: ({ input, controls, mode, previousOutput, repairHint }) => [
      `Task mode: ${mode}.`,
      `Summarize the supplied text using tone ${controls.tone}, style ${controls.writingStyle}, length ${controls.outputLength}, language ${controls.language}.`,
      "Context:",
      formatInputSummary(input),
      previousOutput ? `Existing output to improve or transform:\n${JSON.stringify(previousOutput)}` : "",
      repairHint ? `Revision notes: ${repairHint}` : "",
    ].filter(Boolean).join("\n\n"),
  },
  "browser-improve-writing": {
    toolId: "browser-improve-writing",
    version: "browser-improve-writing@2",
    category: "Browser writing improvement",
    objective: "Upgrade clarity, grammar, rhythm, and persuasiveness in selected text.",
    complexity: "standard",
    outputSections: ["title", "improved result", "suggestions"],
    formattingRules: [
      "Keep the intent intact while improving quality.",
      "Strengthen clarity, rhythm, and flow.",
      "Make the result feel professionally edited.",
    ],
    qualityChecklist: [
      "Improved copy must read cleaner than the source.",
      "Suggestions should reinforce quality or further optimization.",
    ],
    controls: browserPromptCatalog,
    systemPrompt: "You are Zenovee's premium writing editor. Refine rough writing into polished, confident, and usable copy.",
    userPrompt: ({ input, controls, mode, previousOutput, repairHint }) => [
      `Task mode: ${mode}.`,
      `Improve the supplied text using tone ${controls.tone}, style ${controls.writingStyle}, length ${controls.outputLength}, language ${controls.language}.`,
      "Context:",
      formatInputSummary(input),
      previousOutput ? `Existing output to improve or transform:\n${JSON.stringify(previousOutput)}` : "",
      repairHint ? `Revision notes: ${repairHint}` : "",
    ].filter(Boolean).join("\n\n"),
  },
  "browser-seo-helper": {
    toolId: "browser-seo-helper",
    version: "browser-seo-helper@2",
    category: "Browser SEO assistant",
    objective: "Improve on-page SEO quality using selected page context and explicit optimization goals.",
    complexity: "standard",
    outputSections: ["title", "optimized result", "suggestions"],
    formattingRules: [
      "Recommendations should be concrete and specific.",
      "Use the active page context to avoid generic SEO advice.",
      "Keep suggestions practical for marketers and writers.",
    ],
    qualityChecklist: [
      "Optimized result should be stronger than the source text.",
      "Suggestions should prioritize realistic SEO wins.",
    ],
    controls: browserPromptCatalog,
    systemPrompt: "You are Zenovee's senior SEO optimization assistant. Produce practical, commercially aware copy improvements and SEO recommendations.",
    userPrompt: ({ input, controls, mode, previousOutput, repairHint }) => [
      `Task mode: ${mode}.`,
      `Improve the selected page content for SEO using tone ${controls.tone}, style ${controls.writingStyle}, length ${controls.outputLength}, language ${controls.language}.`,
      "SEO context:",
      formatInputSummary(input),
      previousOutput ? `Existing output to improve or transform:\n${JSON.stringify(previousOutput)}` : "",
      repairHint ? `Revision notes: ${repairHint}` : "",
    ].filter(Boolean).join("\n\n"),
  },
  "browser-ad-copy": {
    toolId: "browser-ad-copy",
    version: "browser-ad-copy@2",
    category: "Browser ad copy assistant",
    objective: "Turn page selections into premium ad-ready messaging and quick campaign suggestions.",
    complexity: "standard",
    outputSections: ["title", "ad copy result", "suggestions"],
    formattingRules: [
      "Use the source page context to generate relevant ad messaging.",
      "Balance platform-fit language with conversion intent.",
      "Keep the output practical for quick campaign ideation.",
    ],
    qualityChecklist: [
      "The result should feel usable for ad ideation immediately.",
      "Suggestions should expand on targeting, CTA, or angle opportunities.",
    ],
    controls: browserPromptCatalog,
    systemPrompt: "You are Zenovee's paid acquisition assistant. Transform live page content into premium ad messaging with clear campaign potential.",
    userPrompt: ({ input, controls, mode, previousOutput, repairHint }) => [
      `Task mode: ${mode}.`,
      `Generate ad-ready messaging using tone ${controls.tone}, style ${controls.writingStyle}, length ${controls.outputLength}, language ${controls.language}.`,
      "Source context:",
      formatInputSummary(input),
      previousOutput ? `Existing output to improve or transform:\n${JSON.stringify(previousOutput)}` : "",
      repairHint ? `Revision notes: ${repairHint}` : "",
    ].filter(Boolean).join("\n\n"),
  },
};

export function parseToolPromptAdminOverrides(value: unknown): ToolPromptAdminOverrides {
  const parsed = toolPromptAdminOverridesSchema.safeParse(value);
  return parsed.success
    ? parsed.data
    : {
        systemPromptAppend: "",
        userPromptAppend: "",
        defaultTone: "",
        defaultWritingStyle: "",
        defaultLanguage: "",
        maxValidationRetries: 2,
      };
}

export function getToolPromptProfile(toolId: string, toolCategory?: string) {
  return toolPromptProfiles[toolId] ?? (toolCategory ? categoryPromptProfiles[toolCategory] : undefined);
}

export function getToolPromptControlCatalog(toolId: string, toolCategory?: string): PromptControlCatalog | null {
  const profile = getToolPromptProfile(toolId, toolCategory);
  return profile?.controls ?? null;
}

export function resolvePromptControls(
  toolId: string,
  controls?: PromptRuntimeControls,
  adminOverrides?: ToolPromptAdminOverrides,
  toolCategory?: string
): ResolvedPromptControls {
  const profile = getToolPromptProfile(toolId, toolCategory);
  const defaults = profile?.controls.defaults ?? {
    tone: "Professional",
    writingStyle: "Publish-ready",
    outputLength: "medium",
    language: "English",
  };

  return {
    tone: controls?.tone || adminOverrides?.defaultTone || defaults.tone,
    writingStyle: controls?.writingStyle || adminOverrides?.defaultWritingStyle || defaults.writingStyle,
    outputLength: controls?.outputLength || adminOverrides?.defaultOutputLength || defaults.outputLength,
    language: controls?.language || adminOverrides?.defaultLanguage || defaults.language,
    customInstructions: controls?.customInstructions || undefined,
  };
}

export function buildLegacyToolPrompt(toolId: string, input: Record<string, unknown>) {
  const profile = getToolPromptProfile(toolId);
  if (!profile) {
    return `Return only valid JSON. Input:\n${formatInputSummary(input)}`;
  }

  const controls = profile.controls.defaults;

  return [
    profile.systemPrompt,
    `Objective: ${profile.objective}`,
    `Delivery settings: tone ${controls.tone}, style ${controls.writingStyle}, output length ${controls.outputLength}, language ${controls.language}.`,
    `Required output sections: ${profile.outputSections.join(", ")}.`,
    `Formatting rules: ${profile.formattingRules.join(" ")}`,
    profile.userPrompt({ input, controls, mode: "generate" }),
    "Return only JSON.",
  ].join("\n\n");
}