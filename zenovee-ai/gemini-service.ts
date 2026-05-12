import { geminiAIService } from "@/services/ai/gemini-client";
import type { GeminiModel } from "@/services/ai/types";

export type AIModelType = GeminiModel;

export async function runAI({
  model,
  prompt,
}: {
  model: AIModelType;
  prompt: string;
}) {
  return geminiAIService.generateText({
    model,
    prompt,
  });
}