import { GoogleGenerativeAI } from "@google/generative-ai";
import { z, type ZodSchema } from "zod";
import { env } from "@/lib/env";
import type {
  AIGenerateStructuredInput,
  AIGenerateStructuredResult,
  AIGenerateTextInput,
  AIGenerateTextResult,
  AIUsage,
} from "@/services/ai/types";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Gemini request timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function getUsage(usageMetadata: {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
} | null | undefined): AIUsage {
  return {
    promptTokens: usageMetadata?.promptTokenCount ?? 0,
    completionTokens: usageMetadata?.candidatesTokenCount ?? 0,
    totalTokens: usageMetadata?.totalTokenCount ?? 0,
  };
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export class GeminiAIService {
  private readonly client: GoogleGenerativeAI;

  constructor(apiKey = env.GEMINI_API_KEY) {
    if (!apiKey) {
      throw new Error("Gemini API key is not configured.");
    }

    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateText({
    model,
    prompt,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    temperature = 0.4,
  }: AIGenerateTextInput): Promise<AIGenerateTextResult> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= maxRetries) {
      try {
        const selectedModel = this.client.getGenerativeModel({ model });
        const result = await withTimeout(
          selectedModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature },
          }),
          timeoutMs
        );
        const response = result.response;

        return {
          content: response.text(),
          usage: getUsage(response.usageMetadata),
          model,
        };
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) {
          break;
        }

        const backoffMs = 500 * Math.pow(2, attempt);
        await sleep(backoffMs);
        attempt += 1;
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Gemini request failed.");
  }

  async generateStructured<TSchema extends ZodSchema>({
    schema,
    ...input
  }: AIGenerateStructuredInput<TSchema>): Promise<AIGenerateStructuredResult<z.infer<TSchema>>> {
    const schemaInstruction = [
      "Return ONLY valid JSON.",
      "Do not include markdown, code fences, or extra commentary.",
      `JSON schema: ${JSON.stringify(z.toJSONSchema(schema))}`,
    ].join("\n");

    const textResult = await this.generateText({
      ...input,
      prompt: `${input.prompt}\n\n${schemaInstruction}`,
      temperature: input.temperature ?? 0.2,
    });

    const raw = textResult.content.trim();
    const normalized = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(normalized);
    } catch {
      throw new Error("Gemini returned non-JSON structured output.");
    }

    const data = schema.parse(parsed);

    return {
      ...textResult,
      data,
    };
  }
}

export const geminiAIService = new GeminiAIService();
