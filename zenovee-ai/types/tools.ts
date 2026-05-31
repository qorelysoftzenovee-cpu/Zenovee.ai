import { z } from "zod";
import type { AIModel } from "@/services/ai/models";

export interface ToolField {
  name: string;
  label: string;
  type: "textarea" | "text" | "select" | "number" | "file";
  placeholder?: string;
  exampleValue?: string;
  required?: boolean;
  helperText?: string;
  options?: Array<{ label: string; value: string }>;
}

export interface ToolPreset {
  label: string;
  description?: string;
  values: Record<string, string>;
}

export interface ToolExample {
  title: string;
  description: string;
  values?: Record<string, string>;
}

export interface ToolOutputPreview {
  summary: string;
  sections: string[];
  format: string;
}

export type ToolComplexity = "light" | "medium" | "heavy";

export type ToolOutputType = "article" | "ad-copy" | "persona" | "landing-page" | "text" | "image";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ToolDefinition<TInput = any, TOutput = Record<string, unknown>> {
  id: string;
  metadata: {
    name: string;
    description: string;
    category: string;
    icon: string;
    tagline?: string;
    estimatedTimeSeconds?: number;
    outputType?: ToolOutputType;
    tags?: string[];
    featured?: boolean;
    trending?: boolean;
    availability?: "active" | "coming_soon";
    visibility?: "public" | "internal";
    disabledReason?: string;
    premiumBadge?: string;
    complexity?: ToolComplexity;
    expectedOutputValue?: string;
    creditTooltip?: string;
    audience?: string;
    resultDescription?: string;
    outputPreview?: ToolOutputPreview;
  };
  fields: ToolField[];
  examples?: ToolExample[];
  presets?: ToolPreset[];
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  creditCost: number;
  usageClass?: "standard" | "heavy";
  aiModel: AIModel;
  promptTemplate: (input: TInput) => string;
  outputFormatter: (response: string) => TOutput;
  exportFormats?: Array<"txt" | "md" | "pdf" | "json" | "png">;
}