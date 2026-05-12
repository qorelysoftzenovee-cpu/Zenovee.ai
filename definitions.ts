import { z } from 'zod';
import { ToolDefinition } from './types';

// Define specific input/output schemas for a hypothetical tool
const TextGenerationInputSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
});

const TextGenerationOutputSchema = z.object({
  generatedText: z.string(),
});

const SEOArticleInputSchema = z.object({
  keyword: z.string().min(1, "Target keyword is required"),
  audience: z.string().min(1, "Audience description is required"),
  tone: z.string().default("Professional"),
  length: z.enum(["Short", "Medium", "Long"]).default("Medium"),
  competitorUrl: z.string().url().optional().or(z.literal("")),
});

const AdCopyInputSchema = z.object({
  product: z.string().min(1, "Product details are required"),
  audience: z.string().min(1, "Target audience is required"),
  platform: z.enum(["Google Ads", "Facebook Ads", "X (Twitter) Ads"]),
  tone: z.string().default("Persuasive"),
});

const PersonaInputSchema = z.object({
  websiteUrl: z.string().url().optional().or(z.literal("")),
  niche: z.string().min(1, "Niche is required"),
  targetMarket: z.string().min(1, "Target market is required"),
});

const LandingPageInputSchema = z.object({
  product: z.string().min(1, "Product description is required"),
  audience: z.string().min(1, "Audience is required"),
  problem: z.string().min(1, "Main problem solved is required"),
  tone: z.string().default("Modern"),
});

const BackgroundRemoverInputSchema = z.object({
  image: z.any(), // Handled via base64 or file upload logic
});

const GenericOutputSchema = z.any();

const SEO_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    seoTitle: { type: "string" },
    metaDescription: { type: "string" },
    keywordClusters: { type: "array", items: { type: "string" } },
    outline: { type: "array", items: { type: "string" } },
    fullArticle: { type: "string" },
    internalLinking: { type: "array", items: { type: "string" } }
  },
  required: ["seoTitle", "metaDescription", "fullArticle"]
};

const CodeGenerationInputSchema = z.object({
  description: z.string().min(1, "Description cannot be empty"),
  language: z.string().optional().default("Python"),
});

const codeGenerationTool: ToolDefinition = {
  id: 'code-generation',
  metadata: {
    name: 'Code Generator',
    description: 'Generates production-ready code snippets with optimization notes.',
    category: 'Development',
    icon: 'code',
  },
  fields: [
    { 
      name: 'description', 
      label: 'Code Requirements', 
      type: 'textarea', 
      required: true,
      placeholder: 'Describe the logic, e.g., "A React hook for debouncing search input"'
    },
    { name: 'language', label: 'Language', type: 'select', options: [{ label: 'Python', value: 'python' }, { label: 'JS', value: 'javascript' }] }
  ],
  inputSchema: z.any(),
  outputSchema: z.any(),
  creditCost: 20,
  aiModel: 'gemini-1.5-pro',
  promptTemplate: (i) => `Act as a senior software engineer. Generate high-quality ${i.language} code for: ${i.description}. 
  Provide the response in JSON format with "generatedCode" and "engineeringNotes" keys.`,
  outputFormatter: (r) => r
};

const textGenerationTool: ToolDefinition = {
  id: 'text-generation',
  metadata: {
    name: 'Text Generator',
    description: 'Generates text based on a given prompt.',
    category: 'Content Creation',
    icon: 'pencil',
  },
  fields: [
    { name: 'prompt', label: 'Prompt', type: 'textarea', required: true }
  ],
  inputSchema: TextGenerationInputSchema,
  outputSchema: TextGenerationOutputSchema,
  creditCost: 10,
  aiModel: 'gemini-2.0-flash',
  promptTemplate: (input) => `System: You are a creative writing assistant.\nUser: ${input.prompt}`,
  outputFormatter: (aiResponse) => {
    // If AI returns raw string, wrap it
    return typeof aiResponse === 'string' ? { generatedText: aiResponse } : aiResponse;
  },
};

export const toolRegistry: Record<string, ToolDefinition> = {
  'seo-article': {
    id: 'seo-article',
    metadata: {
      name: 'AI SEO Article Generator',
      description: 'Generate high-ranking, SEO-optimized articles with structured meta data.',
      category: 'Content Creation',
      icon: 'file',
    },
    fields: [
      { name: 'keyword', label: 'Target Keyword', type: 'text', required: true, placeholder: 'e.g. Best SaaS Tools 2024' },
      { name: 'audience', label: 'Target Audience', type: 'text', required: true, placeholder: 'e.g. Small Business Owners' },
      { name: 'tone', label: 'Tone', type: 'select', options: [{ label: 'Professional', value: 'professional' }, { label: 'Conversational', value: 'conversational' }, { label: 'Expert', value: 'expert' }] },
      { name: 'length', label: 'Length', type: 'select', options: [{ label: 'Short (500 words)', value: 'Short' }, { label: 'Medium (1200 words)', value: 'Medium' }, { label: 'Long (2500+ words)', value: 'Long' }] },
      { name: 'competitorUrl', label: 'Competitor URL (Optional)', type: 'text' }
    ],
    inputSchema: SEOArticleInputSchema,
    outputSchema: GenericOutputSchema,
    creditCost: 50,
    aiModel: 'gemini-1.5-pro',
    responseSchema: SEO_RESPONSE_SCHEMA,
    promptTemplate: (i) => `Act as a world-class SEO strategist and copywriter. Generate a comprehensive, high-ranking article for the keyword: "${i.keyword}". 
    Target Audience: ${i.audience}. Tone: ${i.tone}. Desired Length: ${i.length}. ${i.competitorUrl ? `Analyze and outperform this competitor structure: ${i.competitorUrl}` : ''}`,
    outputFormatter: (r) => r,
  },
  'ad-copy': {
    id: 'ad-copy',
    metadata: {
      name: 'AI Ad Copy Generator',
      description: 'Create high-converting ad variations for any social platform.',
      category: 'Marketing',
      icon: 'sparkles',
    },
    fields: [
      { name: 'product', label: 'Product/Service', type: 'textarea', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', required: true },
      { name: 'platform', label: 'Platform', type: 'select', options: [{ label: 'Google Ads', value: 'Google Ads' }, { label: 'Facebook Ads', value: 'Facebook Ads' }, { label: 'X (Twitter)', value: 'X (Twitter) Ads' }] },
    ],
    inputSchema: AdCopyInputSchema,
    outputSchema: GenericOutputSchema,
    creditCost: 15,
    aiModel: 'gemini-2.0-flash',
    promptTemplate: (i) => `Act as a direct-response marketing expert. Create 3 high-converting ad variations for ${i.product}. 
    Target Platform: ${i.platform}. Target Audience: ${i.audience}. Tone: ${i.tone}. Return structured JSON with variations containing headlines, primaryText, and CTA.`,
    outputFormatter: (r) => r,
  },
  'persona-builder': {
    id: 'persona-builder',
    metadata: {
      name: 'AI Customer Persona Builder',
      description: 'Deep dive into your ideal customer demographics and psychology.',
      category: 'Business',
      icon: 'pencil',
    },
    fields: [
      { name: 'niche', label: 'Business Niche', type: 'text', required: true },
      { name: 'targetMarket', label: 'Target Market', type: 'text', required: true },
      { name: 'websiteUrl', label: 'Website URL (Optional)', type: 'text' },
    ],
    inputSchema: PersonaInputSchema,
    outputSchema: GenericOutputSchema,
    creditCost: 25,
    aiModel: 'gemini-2.0-flash',
    promptTemplate: (i) => `Act as a marketing psychologist. Build a detailed buyer persona for the ${i.niche} niche. 
    Target Market: ${i.targetMarket}. Provide a detailed profile including demographics, psychographics, deep pain points, primary goals, buying triggers, and common objections.`,
    outputFormatter: (r) => r,
  },
  'background-remover': {
    id: 'background-remover',
    metadata: {
      name: 'AI Background Remover',
      description: 'Professional-grade background removal using computer vision.',
      category: 'Image Tools',
      icon: 'image',
    },
    fields: [
      { name: 'image', label: 'Upload Image', type: 'file' }
    ],
    inputSchema: BackgroundRemoverInputSchema,
    outputSchema: GenericOutputSchema,
    creditCost: 10,
    aiModel: 'gemini-2.0-flash',
    promptTemplate: (i) => `Identify the main subject in this image and provide precise coordinates for segmentation.`,
    outputFormatter: (r) => ({ resultUrl: r.url || "Processing...", status: "success" }),
  },
  'landing-page': {
    id: 'landing-page',
    metadata: {
      name: 'AI Landing Page Copywriter',
      description: 'Generate full landing page copy from hero to FAQ.',
      category: 'Content Creation',
      icon: 'code',
    },
    fields: [
      { name: 'product', label: 'Product Name/Description', type: 'textarea', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', required: true },
      { name: 'problem', label: 'Main Problem Solved', type: 'textarea', required: true },
      { name: 'tone', label: 'Tone', type: 'select', options: [{ label: 'Modern', value: 'Modern' }, { label: 'Minimalist', value: 'Minimalist' }, { label: 'Bold', value: 'Bold' }] }
    ],
    inputSchema: LandingPageInputSchema,
    outputSchema: GenericOutputSchema,
    creditCost: 40,
    aiModel: 'gemini-1.5-pro',
    promptTemplate: (i) => `Act as a conversion rate optimization (CRO) expert. Write full landing page copy for ${i.product}. 
    Target Audience: ${i.audience}. Core Problem: ${i.problem}. Tone: ${i.tone}. Deliver a structured response with Hero section, value propositions, benefits, FAQ, and social proof suggestions.`,
    outputFormatter: (r) => r,
  },
  'text-generation': textGenerationTool,
  'code-generation': codeGenerationTool,
};

export function getToolDefinition(toolId: string): ToolDefinition | undefined {
  return toolRegistry[toolId];
}

export function listToolDefinitions(): ToolDefinition[] {
  return Object.values(toolRegistry);
}