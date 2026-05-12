import { supabaseAdmin } from "@/lib/supabase";

export class HistoryService {
  static async saveToolExecution(
    userId: string,
    toolId: string,
    toolName: string,
    input: any,
    output: any,
    cost: number,
    tokens: number
  ) {
    return await supabaseAdmin.from('generation_history').insert({
      user_id: userId,
      tool_id: toolId,
      tool_name: toolName,
      input_data: input,
      output_data: output,
      credits_spent: cost,
      model_used: "gemini-pro"
    });
  }
}