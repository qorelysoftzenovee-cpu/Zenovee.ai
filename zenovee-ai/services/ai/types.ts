import type { ZodSchema } from "zod";
import type { AIModel } from "@/services/ai/models";

export type { AIModel } from "@/services/ai/models";
export type AIProvider = "groq";

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIGenerateTextInput {
  model: AIModel;
  prompt: string;
  systemPrompt?: string;
  timeoutMs?: number;
  maxRetries?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface AIGenerateStructuredInput<TSchema extends ZodSchema> extends AIGenerateTextInput {
  schema: TSchema;
}

export interface AIGenerateTextResult {
  content: string;
  usage: AIUsage;
  model: AIModel;
  provider: AIProvider;
  costUsd: number;
  latencyMs?: number;
}

export interface AIGenerateStructuredResult<T> extends AIGenerateTextResult {
  data: T;
}
