import { z } from 'zod';

export type ToolInput = any;
export type ToolOutput = any;

export interface ToolField {
  name: string;
  label: string;
  type: 'textarea' | 'text' | 'select' | 'number' | 'file';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

export interface ToolMetadata {
  name: string;
  description: string;
  category: string;
  icon: string;
}

export interface ToolDefinition {
  id: string;
  metadata: ToolMetadata;
  fields: ToolField[];
  inputSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
  creditCost: number;
  aiModel: 'gemini-2.0-flash' | 'gemini-1.5-pro';
  promptTemplate: (input: any) => string;
  outputFormatter: (aiResponse: any) => ToolOutput;
  responseSchema?: any;
}