import { groqAIService } from "@/services/ai/groq-client";
import type { ZodSchema } from "zod";
import type {
  AIGenerateStructuredInput,
  AIGenerateTextResult,
  AIModel,
} from "@/services/ai/types";

export type AIModelType = AIModel;

export function selectModelForTier(tier: "light" | "premium"): AIModelType {
  if (tier === "premium") {
    return "llama-3.1-70b-versatile";
  }

  return "llama-3.1-8b-instant";
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
  return groqAIService.generateText({
    model,
    prompt,
    systemPrompt,
    temperature,
    maxTokens,
  });
}

export async function runAIStructuredWithSchema<TSchema extends ZodSchema>(input: AIGenerateStructuredInput<TSchema>) {
  return groqAIService.generateStructured(input);
}

export type { AIGenerateTextInput, AIGenerateStructuredInput } from "@/services/ai/types";
