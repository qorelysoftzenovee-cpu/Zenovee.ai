import { z } from 'zod';
import { getToolDefinition, listToolDefinitions } from './definitions';
import { CreditService } from './credit-service';
import { HistoryService } from './history-service';
import { ToolInput, ToolOutput } from './types';
import { runAI, AIModelType } from '@/services/ai/gemini';
import { supabaseAdmin } from '@/lib/supabase';

export class ToolEngine {
  private userId: string;

  constructor(userId: string) {
    if (!userId) {
      throw new Error("ToolEngine requires a userId.");
    }
    this.userId = userId;
  }

  async executeTool(
    toolId: string, 
    rawInput: unknown
  ): Promise<{ output: ToolOutput; remainingCredits: number; usage?: any }> {
    const tool = getToolDefinition(toolId);

    if (!tool) {
      throw new Error(`Tool with ID "${toolId}" not found.`);
    }

    // 1. Input Validation
    const validationResult = tool.inputSchema.safeParse(rawInput);
    if (!validationResult.success) {
      throw new Error(`Input validation failed for tool "${toolId}": ${validationResult.error.message}`);
    }
    const validatedInput: ToolInput = validationResult.data;

    // 2. Credit Check
    const hasCredits = await CreditService.checkCredits(this.userId, tool.creditCost);
    if (!hasCredits) {
      throw new Error(`Insufficient credits to execute tool "${toolId}".`);
    }

    // 3. Vertex AI / Gemini interaction via prompt template
    let rawOutput: unknown;
    try {
      const prompt = tool.promptTemplate(validatedInput);
      const aiResponse: any = await runAI({
        model: tool.aiModel as AIModelType,
        prompt: prompt,
        responseSchema: tool.responseSchema
      });
      
      rawOutput = tool.outputFormatter(aiResponse);

      const usage = aiResponse.usageMetadata;

      // 5. Deduct Credits (only if successful)
      await CreditService.deductCredits(this.userId, tool.creditCost);

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', this.userId)
        .single();

      // 6. Save History
      await HistoryService.saveToolExecution(
        this.userId, 
        toolId, 
        tool.metadata.name, 
        validatedInput, 
        rawOutput, 
        tool.creditCost,
        usage?.totalTokenCount || 0 
      );

      return { 
        output: rawOutput as ToolOutput, 
        remainingCredits: profile?.credits ?? 0,
        usage 
      };

    } catch (aiError: any) {
      console.error(`AI execution failed for tool "${toolId}":`, aiError);
      throw new Error(`AI model execution failed: ${aiError.message || 'Unknown error'}`);
    }
  }

  getToolList() {
    return listToolDefinitions().map(tool => ({
      id: tool.id,
      metadata: tool.metadata,
      creditCost: tool.creditCost,
    }));
  }
}