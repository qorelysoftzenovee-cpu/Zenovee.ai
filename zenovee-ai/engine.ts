import { getToolDefinition, listToolDefinitions } from "@/definitions";
import { CreditService } from "@/credit-service";
import { HistoryService } from "@/history-service";
import { runAI } from "@/services/ai";
import { AIProtectionService } from "@/services/ai/protection";
import type { Json } from "@/lib/supabase/types";

export class ToolEngine {
  constructor(private readonly userId: string) {}

  async executeTool(toolId: string, rawInput: unknown, ipAddress: string) {
    const tool = getToolDefinition(toolId);
    if (!tool) {
      throw new Error("Requested tool was not found.");
    }

    const sanitizedInput = AIProtectionService.sanitizeInput(rawInput);
    const validatedInput = tool.inputSchema.parse(sanitizedInput) as Record<string, unknown>;
    await CreditService.ensureSufficientCredits(this.userId, tool.creditCost);

    const prompt = tool.promptTemplate(validatedInput);
    const protection = await AIProtectionService.validateBeforeGeneration({
      userId: this.userId,
      toolId: tool.id,
      usageClass: tool.usageClass ?? "standard",
      prompt,
      input: validatedInput,
      ipAddress,
    });

    const aiResponse = await runAI({
      model: tool.aiModel,
      prompt,
    }).catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown provider error";
      await AIProtectionService.markProviderFailure({
        userId: this.userId,
        toolId: tool.id,
        ipAddress,
        usageClass: tool.usageClass ?? "standard",
        planId: protection.planId,
        promptChars: prompt.length,
        provider: "groq",
        error: message,
      });
      throw error;
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
      apiCost: aiResponse.costUsd,
      provider: aiResponse.provider,
      model: aiResponse.model,
      usage: aiResponse.usage,
    });

    await AIProtectionService.markCompletion({
      userId: this.userId,
      toolId: tool.id,
      ipAddress,
      usageClass: tool.usageClass ?? "standard",
      planId: protection.planId,
      promptChars: prompt.length,
      totalTokens: aiResponse.usage.totalTokens,
    });

    return {
      output: formattedOutput,
      remainingCredits,
      usage: aiResponse.usage,
    };
  }

  getToolList() {
    return listToolDefinitions().map(({ id, metadata, creditCost, fields, usageClass }) => ({
      id,
      metadata,
      creditCost,
      fields,
      usageClass: usageClass ?? "standard",
    }));
  }
}