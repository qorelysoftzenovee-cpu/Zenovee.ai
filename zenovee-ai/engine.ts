import { getToolDefinition, listToolDefinitions } from "@/definitions";
import { CreditService } from "@/credit-service";
import { HistoryService } from "@/history-service";
import { runAI } from "@/gemini-service";
import type { Json } from "@/lib/supabase/types";

export class ToolEngine {
  constructor(private readonly userId: string) {}

  async executeTool(toolId: string, rawInput: unknown) {
    const tool = getToolDefinition(toolId);
    if (!tool) {
      throw new Error("Requested tool was not found.");
    }

    const validatedInput = tool.inputSchema.parse(rawInput) as Record<string, unknown>;
    await CreditService.ensureSufficientCredits(this.userId, tool.creditCost);

    const prompt = tool.promptTemplate(validatedInput);
    const aiResponse = await runAI({
      model: tool.aiModel,
      prompt,
    });

    const formattedOutput = tool.outputFormatter(aiResponse.content) as Record<string, unknown>;
    tool.outputSchema.parse(formattedOutput);

    const remainingCredits = await CreditService.deductCredits(
      this.userId,
      tool.creditCost,
      `${tool.metadata.name} execution`
    );

    await HistoryService.saveToolExecution({
      userId: this.userId,
      toolId: tool.id,
      toolName: tool.metadata.name,
      input: validatedInput as Json,
      output: formattedOutput as Json,
      cost: tool.creditCost,
    });

    return {
      output: formattedOutput,
      remainingCredits,
      usage: aiResponse.usage,
    };
  }

  getToolList() {
    return listToolDefinitions().map(({ id, metadata, creditCost, fields }) => ({
      id,
      metadata,
      creditCost,
      fields,
    }));
  }
}