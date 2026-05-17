import { z } from "zod";

export interface ToolField {
  name: string;
  label: string;
  type: "textarea" | "text" | "select" | "number" | "file";
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ToolDefinition<TInput = any, TOutput = Record<string, unknown>> {
  id: string;
  metadata: {
    name: string;
    description: string;
    category: string;
    icon: string;
    availability?: "active" | "coming_soon";
    disabledReason?: string;
  };
  fields: ToolField[];
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  creditCost: number;
  usageClass?: "standard" | "heavy";
  aiModel: "llama-3.1-70b-versatile" | "llama-3.1-8b-instant" | "mixtral-8x7b";
  promptTemplate: (input: TInput) => string;
  outputFormatter: (response: string) => TOutput;
  exportFormats?: Array<"txt" | "md" | "pdf" | "json" | "png">;
}