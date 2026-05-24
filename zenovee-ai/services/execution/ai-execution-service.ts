import { generateToolOutput, type AIGenerationError } from "@/services/ai/prompt-orchestrator";
import type { GenerationExecutionOptions } from "@/services/ai/prompt-system";
import type { ToolDefinition } from "@/types/tools";

const TRANSIENT_ERROR_PATTERNS = ["timed out", "timeout", "rate limit", "429", "overloaded", "temporarily unavailable", "empty response", "malformed"];

function isTransientError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase();
  return TRANSIENT_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

export class AIExecutionService {
  static isRetryable(error: unknown) {
    const generationError = error as Partial<AIGenerationError> | undefined;
    if (typeof generationError?.retryable === "boolean") return generationError.retryable;
    return isTransientError(error);
  }

  static async execute(params: {
    tool: ToolDefinition<Record<string, unknown>, Record<string, unknown>>;
    input: Record<string, unknown>;
    options: GenerationExecutionOptions;
    adminOverrides?: unknown;
  }) {
    return generateToolOutput(params);
  }
}
