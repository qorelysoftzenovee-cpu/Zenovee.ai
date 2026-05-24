import { getToolDefinition, listToolDefinitions } from "@/definitions";
import { ToolExecutionService } from "@/services/tool-execution-service";

export class ToolEngine {
  constructor(private readonly userId: string) {}

  async executeTool(toolId: string, rawInput: unknown, ipAddress: string) {
    const result = await ToolExecutionService.execute({
      userId: this.userId,
      toolId,
      rawInput,
      ipAddress,
    });

    return {
      executionId: result.executionId,
      output: result.output,
      remainingCredits: result.remainingCredits,
      usage: result.usage,
    };
  }

  getToolList() {
    return listToolDefinitions().map(({ id, metadata, creditCost, fields, usageClass, exportFormats }) => ({
      id,
      metadata,
      creditCost,
      fields,
      usageClass: usageClass ?? "standard",
      exportFormats: exportFormats ?? ["json"],
    }));
  }
}