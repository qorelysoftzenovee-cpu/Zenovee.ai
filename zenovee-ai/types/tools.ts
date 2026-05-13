import { z } from "zod";

export interface ToolField {
  name: string;
  label: string;
  type: "textarea" | "text" | "select" | "number";
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
}

export interface ToolDefinition<TInput = unknown, TOutput = Record<string, unknown>> {
  id: string;
  metadata: {
    name: string;
    description: string;
    category: string;
    icon: string;
  };
  fields: ToolField[];
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  creditCost: number;
  usageClass?: "standard" | "heavy";
  aiModel: "llama-3.1-70b-versatile" | "llama-3.1-8b-instant" | "mixtral-8x7b";
  promptTemplate: (input: TInput) => string;
  outputFormatter: (response: string) => TOutput;
}