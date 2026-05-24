import { z } from "zod";
import type { ToolDefinition } from "@/types/tools";

export class OutputValidationService {
  static validateStructuredOutput(tool: ToolDefinition<Record<string, unknown>, Record<string, unknown>>, output: unknown) {
    const parsed = tool.outputSchema.safeParse(output);
    if (!parsed.success) {
      throw new Error(`Output schema validation failed: ${z.prettifyError(parsed.error)}`);
    }
    return parsed.data;
  }
}
