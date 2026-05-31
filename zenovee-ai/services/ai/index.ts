import { getGroqAIService } from "@/services/ai/groq-client";
import type { ZodSchema } from "zod";
import { getDefaultModelForTier, type AIModel } from "@/services/ai/models";
import type {
  AIGenerateStructuredInput,
  AIGenerateTextResult,
} from "@/services/ai/types";

export type AIModelType = AIModel;

export function selectModelForTier(tier: "light" | "premium"): AIModelType {
  return getDefaultModelForTier(tier);
}

export async function runAI({
  model,
  prompt,
  systemPrompt,
  temperature,
  maxTokens,
}: {
  model: AIModelType;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<AIGenerateTextResult> {
  return getGroqAIService().generateText({
    model,
    prompt,
    systemPrompt,
    temperature,
    maxTokens,
  });
}

export async function runAIStructuredWithSchema<TSchema extends ZodSchema>(input: AIGenerateStructuredInput<TSchema>) {
  return getGroqAIService().generateStructured(input);
}

export type { AIGenerateTextInput, AIGenerateStructuredInput } from "@/services/ai/types";
export type { AIModel, AIProvider } from "@/services/ai/types";
