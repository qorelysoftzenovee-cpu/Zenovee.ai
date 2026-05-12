import type { ZodSchema } from "zod";

export type GeminiModel = "gemini-2.0-flash" | "gemini-1.5-pro";

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIGenerateTextInput {
  model: GeminiModel;
  prompt: string;
  timeoutMs?: number;
  maxRetries?: number;
  temperature?: number;
}

export interface AIGenerateStructuredInput<TSchema extends ZodSchema> extends AIGenerateTextInput {
  schema: TSchema;
}

export interface AIGenerateTextResult {
  content: string;
  usage: AIUsage;
  model: GeminiModel;
}

export interface AIGenerateStructuredResult<T> extends AIGenerateTextResult {
  data: T;
}
