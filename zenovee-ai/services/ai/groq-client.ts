import { z, type ZodSchema } from "zod";
import { env, validateAiEnv } from "@/lib/env";
import type {
  AIGenerateStructuredInput,
  AIGenerateStructuredResult,
  AIGenerateTextInput,
  AIGenerateTextResult,
  AIModel,
  AIUsage,
} from "@/services/ai/types";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2;

const MODEL_PRICING_PER_1M_TOKENS: Record<AIModel, { input: number; output: number }> = {
  "llama-3.1-70b-versatile": { input: 0.59, output: 0.79 },
  "llama-3.1-8b-instant": { input: 0.05, output: 0.08 },
  "mixtral-8x7b": { input: 0.24, output: 0.24 },
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Groq request timed out after ${timeoutMs}ms.`)), timeoutMs);
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

function getUsage(usage: {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
} | null | undefined): AIUsage {
  return {
    promptTokens: usage?.prompt_tokens ?? 0,
    completionTokens: usage?.completion_tokens ?? 0,
    totalTokens: usage?.total_tokens ?? 0,
  };
}

function calculateCostUsd(model: AIModel, usage: AIUsage): number {
  const pricing = MODEL_PRICING_PER_1M_TOKENS[model];
  const inputCost = (usage.promptTokens / 1_000_000) * pricing.input;
  const outputCost = (usage.completionTokens / 1_000_000) * pricing.output;
  return Number((inputCost + outputCost).toFixed(8));
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export class GroqAIService {
  constructor(private readonly apiKey = env.GROQ_API_KEY) {
    validateAiEnv();

    if (!this.apiKey) {
      throw new Error("Groq API key is not configured.");
    }
  }

  async generateText({
    model,
    prompt,
    systemPrompt,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    temperature = 0.4,
    maxTokens,
  }: AIGenerateTextInput): Promise<AIGenerateTextResult> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= maxRetries) {
      try {
        const body = {
          model,
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: prompt },
          ],
          temperature,
          ...(typeof maxTokens === "number" ? { max_tokens: maxTokens } : {}),
        };

        const response = await withTimeout(
          fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }),
          timeoutMs
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Groq request failed (${response.status}): ${errorText}`);
        }

        const json = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
        };

        const content = json.choices?.[0]?.message?.content?.trim();
        if (!content) {
          throw new Error("Groq returned empty content.");
        }

        const usage = getUsage(json.usage);

        return {
          content,
          usage,
          model,
          provider: "groq",
          costUsd: calculateCostUsd(model, usage),
        };
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) break;
        const backoffMs = 500 * Math.pow(2, attempt);
        await sleep(backoffMs);
        attempt += 1;
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Groq request failed.");
  }

  async generateStructured<TSchema extends ZodSchema>({
    schema,
    ...input
  }: AIGenerateStructuredInput<TSchema>): Promise<AIGenerateStructuredResult<z.infer<TSchema>>> {
    const schemaInstruction = [
      "Return ONLY valid JSON.",
      "Do not include markdown, code fences, or additional commentary.",
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
      throw new Error("Groq returned non-JSON structured output.");
    }

    const data = schema.parse(parsed);
    return { ...textResult, data };
  }
}

let groqAIServiceInstance: GroqAIService | null = null;

export function getGroqAIService() {
  if (!groqAIServiceInstance) {
    groqAIServiceInstance = new GroqAIService(env.GROQ_API_KEY || "__MISSING_GROQ_KEY__");
  }

  return groqAIServiceInstance;
}
