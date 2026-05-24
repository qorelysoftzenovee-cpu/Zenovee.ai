import { buildToolPromptPreview } from "@/services/ai/prompt-orchestrator";
import type { GenerationExecutionOptions } from "@/services/ai/prompt-system";
import type { ToolDefinition } from "@/types/tools";

export class PromptBuilderService {
  static buildOptimizedPrompt(params: {
    tool: ToolDefinition<Record<string, unknown>, Record<string, unknown>>;
    input: Record<string, unknown>;
    options: GenerationExecutionOptions;
    adminOverrides?: unknown;
  }) {
    const prompt = buildToolPromptPreview(params);
    return {
      prompt,
      promptChars: prompt.length,
    };
  }
}
