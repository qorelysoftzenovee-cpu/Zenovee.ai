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
    provider?: string;
    model?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    prompt?: string;
    durationMs?: number;
  }) {
    const { data, error } = await supabaseAdmin
      .from("tool_usage")
      .insert({
        user_id: args.userId,
        tool_id: args.toolId,
        tool_name: args.toolName,
        credits_consumed: args.cost,
        ai_model: args.model ?? null,
        provider: args.provider ?? null,
        generation_duration_ms: args.durationMs ?? null,
        input: args.input,
        output: args.output,
        api_cost: args.apiCost ?? 0,
      })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      throw new Error(error.message);
    }

    if (args.provider && args.model) {
      const { error: usageError } = await supabaseAdmin.from("api_usage").insert({
        user_id: args.userId,
        provider: args.provider,
        model: args.model,
        token_usage: args.usage?.totalTokens ?? 0,
        prompt_tokens: args.usage?.promptTokens ?? 0,
        completion_tokens: args.usage?.completionTokens ?? 0,
        cost: args.apiCost ?? 0,
        status: "success",
        failure_count: 0,
      });

      if (usageError) {
        throw new Error(usageError.message);
      }
    }

    await supabaseAdmin.from("generation_history").insert({
      user_id: args.userId,
      tool_usage_id: data.id,
      tool_id: args.toolId,
      prompt: args.prompt ?? null,
      output: typeof args.output === "string" ? args.output : JSON.stringify(args.output),
      exports: null,
      metadata: {
        toolName: args.toolName,
        apiCost: args.apiCost ?? 0,
      },
    });

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