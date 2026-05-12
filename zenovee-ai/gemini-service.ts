import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";

export type AIModelType = "gemini-2.0-flash" | "gemini-1.5-pro";

export async function runAI({
  model,
  prompt,
}: {
  model: AIModelType;
  prompt: string;
}) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const selectedModel = client.getGenerativeModel({ model });
  const result = await selectedModel.generateContent(prompt);
  const response = result.response;

  return {
    content: response.text(),
    usage: {
      promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
    },
  };
}