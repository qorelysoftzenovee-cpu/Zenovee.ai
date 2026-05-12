import { GoogleGenerativeAI, GenerativeModel, CountTokensResponse } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type AIModelType = 'gemini-2.0-flash' | 'gemini-1.5-pro';

interface RunAIArgs {
  model: AIModelType;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  responseSchema?: any; // Structured output support
}

export interface AIResponse {
  content: string;
  structuredData?: any;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Core AI Engine for Gemini API interaction
 */
export async function runAI({
  model,
  prompt,
  temperature = 0.7,
  maxTokens,
  responseSchema
}: RunAIArgs): Promise<AIResponse> {
  const selectedModel: GenerativeModel = genAI.getGenerativeModel({ 
    model,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: responseSchema ? "application/json" : "text/plain",
      responseSchema: responseSchema,
    }
  });

  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 30000; // 30 seconds

  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const result = await selectedModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      clearTimeout(timeoutId);
      
      const response = result.response;
      const text = response.text();
      
      // Usage metadata from Gemini
      const usageMetadata = response.usageMetadata || {
        promptTokenCount: 0,
        candidatesTokenCount: 0,
        totalTokenCount: 0,
      };

      return {
        content: text,
        structuredData: responseSchema ? JSON.parse(text) : null,
        usage: {
          promptTokens: usageMetadata.promptTokenCount,
          completionTokens: usageMetadata.candidatesTokenCount,
          totalTokens: usageMetadata.totalTokenCount,
        }
      };

    } catch (error: any) {
      lastError = error;
      
      // Don't retry on validation errors or auth errors
      if (error.status === 400 || error.status === 401) {
        break;
      }

      // Exponential backoff for retries
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  console.error(`Gemini API failed after ${MAX_RETRIES} attempts:`, lastError);
  throw new Error(
    lastError?.message?.includes("abort") 
      ? "AI request timed out." 
      : `AI Execution Error: ${lastError?.message || "Unknown error"}`
  );
}