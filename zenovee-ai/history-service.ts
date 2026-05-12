import type { Json } from "@/lib/supabase/types";
import { supabaseAdmin } from "@/lib/supabase/admin";

export class HistoryService {
  static async saveToolExecution(args: {
    userId: string;
    toolId: string;
    toolName: string;
    input: Json;
    output: Json;
    cost: number;
    apiCost?: number;
  }) {
    const { data, error } = await supabaseAdmin
      .from("tool_usage")
      .insert({
        user_id: args.userId,
        tool_id: args.toolId,
        tool_name: args.toolName,
        input: args.input,
        output: args.output,
        cost: args.cost,
        api_cost: args.apiCost ?? 0,
      })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async saveGenerationFile(args: {
    userId: string;
    toolUsageId?: string;
    storagePath: string;
    fileType: string;
    metadata?: Json;
  }) {
    const { error } = await supabaseAdmin.from("generation_history").insert({
      user_id: args.userId,
      tool_usage_id: args.toolUsageId ?? null,
      storage_path: args.storagePath,
      file_type: args.fileType,
      metadata: args.metadata ?? null,
    });
    if (error) throw new Error(error.message);
  }
}