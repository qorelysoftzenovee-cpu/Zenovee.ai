import { getToolDefinition, listToolDefinitions } from "@/definitions";
import { AIProtectionError, AIProtectionService } from "@/services/ai/protection";
import { buildToolPromptPreview, generateToolOutput } from "@/services/ai/prompt-orchestrator";
import { generationExecutionOptionsSchema, getToolPromptControlCatalog } from "@/services/ai/prompt-system";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import type { ToolDefinition } from "@/types/tools";
import { listWorkspaceConfigs } from "@/services/workspaces/registry";
import { serverLog } from "@/lib/logger";

type SupabaseRpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

type ExecuteArgs = {
  userId: string;
  toolId: string;
  rawInput: unknown;
  options?: unknown;
  ipAddress: string;
  idempotencyKey?: string | null;
  workspaceId?: string | null;
  moduleId?: string | null;
};

type WorkspaceConfigRow = {
  workspace_id: string;
  visibility: "public" | "private";
  audience_presets: unknown;
  tone_presets: unknown;
  template_presets: unknown;
};

const TOOL_EXECUTION_TIMEOUT_MS = 90_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export class ToolExecutionService {
  static async getCredits(userId: string) {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("user_credits")
      .select("available_credits")
      .eq("user_id", userId)
      .maybeSingle<{ available_credits: number }>();
    return Number(data?.available_credits ?? 0);
  }

  static async listToolsWithPricing() {
    const supabase = getSupabaseAdmin();
    const defs = listToolDefinitions();
    const { data: pricesRaw } = await supabase.from("tool_pricing").select("tool_id,credits_cost,is_active,cooldown_seconds,metadata");
    const prices = (pricesRaw ?? []) as Array<{ tool_id: string; credits_cost: number; is_active: boolean; cooldown_seconds: number; metadata?: Record<string, unknown> | null }>;
    const map = new Map(prices.map((p) => [p.tool_id, p]));

    return defs.map((d) => {
      const price = map.get(d.id);
      const generationControls = getToolPromptControlCatalog(d.id);
      return {
        id: d.id,
        metadata: d.metadata,
        creditCost: price?.credits_cost ?? d.creditCost,
        fields: d.fields,
        examples: d.examples ?? [],
        presets: d.presets ?? [],
        usageClass: d.usageClass ?? "standard",
        exportFormats: d.exportFormats ?? ["json"],
        disabled: d.metadata.availability === "coming_soon" || price?.is_active === false,
        cooldownSeconds: Number(price?.cooldown_seconds ?? 0),
        generationControls,
      };
    });
  }

  static async listWorkspacesWithPricing() {
    const supabase = getSupabaseAdmin();
    const tools = await this.listToolsWithPricing();
    const toolsById = new Map(tools.map((tool) => [tool.id, tool]));
    const { data: configRows } = await supabase
      .from("workspace_configs")
      .select("workspace_id,visibility,audience_presets,tone_presets,template_presets")
      .returns<WorkspaceConfigRow[]>();
    const configMap = new Map((configRows ?? []).map((row) => [row.workspace_id, row]));

    return listWorkspaceConfigs()
      .map((workspace) => {
        const override = configMap.get(workspace.id);
        return {
          ...workspace,
          audiencePresets: Array.isArray(override?.audience_presets) ? override.audience_presets.map(String) : workspace.audiencePresets,
          tonePresets: Array.isArray(override?.tone_presets) ? override.tone_presets.map(String) : workspace.tonePresets,
          templatePresets: Array.isArray(override?.template_presets) ? override.template_presets.map(String) : workspace.templatePresets,
          visibility: (override?.visibility as "public" | "private" | undefined) ?? "public",
          modules: workspace.modules.map((module) => {
        const resolvedTool = module.toolId ? toolsById.get(module.toolId) : null;
        const effectiveAvailability = module.availability ?? (resolvedTool?.disabled ? "coming_soon" : "active");

        return {
          ...module,
          availability: effectiveAvailability,
          tool: resolvedTool
            ? {
                id: resolvedTool.id,
                metadata: resolvedTool.metadata,
                creditCost: resolvedTool.creditCost,
                fields: resolvedTool.fields,
                examples: resolvedTool.examples,
                presets: resolvedTool.presets,
                exportFormats: resolvedTool.exportFormats,
                usageClass: resolvedTool.usageClass,
                disabled: resolvedTool.disabled,
                cooldownSeconds: resolvedTool.cooldownSeconds,
                generationControls: resolvedTool.generationControls,
              }
            : null,
        };
          }),
        };
      })
      .filter((workspace) => workspace.visibility !== "private");
  }

  static async execute(args: ExecuteArgs) {
    const supabase = getSupabaseAdmin();
    const tool = getToolDefinition(args.toolId);
    if (!tool) throw new Error("Requested tool was not found.");
    if (tool.metadata.availability === "coming_soon") throw new Error(tool.metadata.disabledReason ?? "Tool unavailable.");

    const [{ data: priceRaw }, { data: subscriptionRaw }] = await Promise.all([
      supabase.from("tool_pricing").select("credits_cost,is_active,cooldown_seconds,metadata").eq("tool_id", tool.id).maybeSingle<{ credits_cost: number; is_active: boolean; cooldown_seconds: number; metadata: Record<string, unknown> | null }>(),
      supabase
        .from("subscriptions")
        .select("status,grace_until")
        .eq("user_id", args.userId)
        .in("status", ["ACTIVE", "PAST_DUE"])
        .maybeSingle<{ status: string; grace_until: string | null }>(),
    ]);

    const price = priceRaw as { credits_cost: number; is_active: boolean; cooldown_seconds: number; metadata: Record<string, unknown> | null } | null;
    const subscription = subscriptionRaw as { status: string; grace_until: string | null } | null;

    if (!subscription) throw new Error("Active subscription required.");
    if (price && price.is_active === false) throw new Error("This tool is temporarily disabled by admin.");

    const idempotencyKey = args.idempotencyKey ?? null;
    if (idempotencyKey) {
      const { data: existingRaw } = await supabase
        .from("tool_executions")
        .select("id,status,output,error_message,token_estimate")
        .eq("user_id", args.userId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle<{
          id: string;
          status: "success" | "failed" | "pending" | "running" | "blocked";
          output: Json | null;
          error_message: string | null;
          token_estimate: number;
        }>();

      const existing = existingRaw as {
        id: string;
        status: "success" | "failed" | "pending" | "running" | "blocked";
        output: Json | null;
        error_message: string | null;
        token_estimate: number;
      } | null;

      if (existing?.status === "success") {
        return { executionId: existing.id, output: existing.output, usage: { totalTokens: existing.token_estimate }, replay: true };
      }
      if (existing?.status === "running" || existing?.status === "pending") {
        throw new Error("Duplicate execution in progress. Please retry shortly.");
      }
    }

    const cooldownSeconds = Number(price?.cooldown_seconds ?? 0);
    if (cooldownSeconds > 0) {
      const cooldownCutoff = new Date(Date.now() - cooldownSeconds * 1000).toISOString();
      const { data: recentExecution } = await supabase
        .from("tool_executions")
        .select("id,status,created_at")
        .eq("user_id", args.userId)
        .eq("tool_id", tool.id)
        .gte("created_at", cooldownCutoff)
        .in("status", ["pending", "running", "success"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string; status: "pending" | "running" | "success"; created_at: string }>();

      if (recentExecution?.created_at) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((new Date(recentExecution.created_at).getTime() + cooldownSeconds * 1000 - Date.now()) / 1000)
        );
        throw new Error(`Please wait ${retryAfterSeconds}s before running this tool again.`);
      }
    }

    const sanitizedInput = AIProtectionService.sanitizeInput(args.rawInput);
    const validatedInput = tool.inputSchema.parse(sanitizedInput) as Record<string, unknown>;
    const executionOptions = generationExecutionOptionsSchema.parse(args.options ?? {});
    const prompt = buildToolPromptPreview({
      tool: tool as ToolDefinition<Record<string, unknown>, Record<string, unknown>>,
      input: validatedInput,
      options: executionOptions,
      adminOverrides: price?.metadata,
    });

    const protection = await AIProtectionService.validateBeforeGeneration({
      userId: args.userId,
      toolId: tool.id,
      usageClass: tool.usageClass ?? "standard",
      prompt,
      input: validatedInput,
      ipAddress: args.ipAddress,
    });

    const creditCost = Number(price?.credits_cost ?? tool.creditCost);
    const { data: execution, error: executionError } = await supabase
      .from("tool_executions")
      .insert({
        user_id: args.userId,
        tool_id: tool.id,
        tool_name: tool.metadata.name,
        idempotency_key: idempotencyKey,
        status: "running",
        input: validatedInput,
        ip_address: args.ipAddress,
        credits_charged: creditCost,
      } as never)
      .select("id")
      .single<{ id: string }>();
    if (executionError || !execution) {
      const executionErrorMessage = executionError?.message ?? "Failed to initialize execution.";
      if (executionErrorMessage.toLowerCase().includes("duplicate") || executionErrorMessage.includes("23505")) {
        throw new Error("Duplicate execution in progress. Please retry shortly.");
      }
      throw new Error(executionErrorMessage);
    }

    const supabaseRpc = supabase as unknown as SupabaseRpcClient;
    const { data: debitRaw, error: debitError } = await supabaseRpc.rpc("debit_user_credits", {
      p_user_id: args.userId,
      p_credits: creditCost,
      p_reference: `tool:${tool.id}`,
      p_execution_id: execution.id,
      p_metadata: { toolId: tool.id, toolName: tool.metadata.name },
    });

    if (debitError) {
      await supabase.from("tool_executions").update({ status: "blocked", error_message: debitError.message } as never).eq("id", execution.id);
      throw new Error(debitError.message.includes("INSUFFICIENT_CREDITS") ? "Insufficient credits for this tool execution." : debitError.message);
    }

    const debit = debitRaw as Array<{ balance_before: number; balance_after: number; transaction_id: string }> | null;
    const debitRow = Array.isArray(debit) ? debit[0] : null;
    const debitTxId = debitRow?.transaction_id as string | undefined;

    const startedAt = Date.now();
    try {
      const generation = await withTimeout(
        generateToolOutput({
          tool: tool as ToolDefinition<Record<string, unknown>, Record<string, unknown>>,
          input: validatedInput,
          options: executionOptions,
          adminOverrides: price?.metadata,
        }),
        TOOL_EXECUTION_TIMEOUT_MS,
        "Tool execution timed out. Please retry."
      );
      const { aiResponse, output, meta } = generation;

      const executionMs = Date.now() - startedAt;
      const tokenEstimate = Number(aiResponse.usage.totalTokens ?? 0);
      const estimatedApiCost = Number(aiResponse.costUsd ?? 0);

      await Promise.all([
        supabase.from("tool_executions").update({
          status: "success",
          output,
          error_message: null,
          api_model: aiResponse.model,
          api_provider: aiResponse.provider,
          token_estimate: tokenEstimate,
          estimated_api_cost: estimatedApiCost,
          execution_ms: executionMs,
        } as never).eq("id", execution.id),
        supabase.from("tool_usage_logs").insert({
          execution_id: execution.id,
          user_id: args.userId,
          tool_id: tool.id,
          credits_consumed: creditCost,
          status: "success",
          metadata: {
            toolName: tool.metadata.name,
            workspaceId: args.workspaceId ?? null,
            moduleId: args.moduleId ?? null,
            promptVersion: meta.promptVersion,
            attempts: meta.attempts,
            qualityScore: meta.qualityScore,
            mode: meta.mode,
            modelReason: meta.modelReason,
            controls: meta.controls,
          },
        } as never),
        supabase.from("api_usage_logs").insert({
          execution_id: execution.id,
          user_id: args.userId,
          provider: aiResponse.provider,
          model: aiResponse.model,
          prompt_tokens: aiResponse.usage.promptTokens,
          completion_tokens: aiResponse.usage.completionTokens,
          total_tokens: aiResponse.usage.totalTokens,
          estimated_cost: estimatedApiCost,
          status: "success",
          latency_ms: aiResponse.latencyMs ?? executionMs,
        } as never),
        supabase.from("tool_usage").insert({
          user_id: args.userId,
          tool_id: tool.id,
          tool_name: tool.metadata.name,
          input: validatedInput as Json,
          output: output as Json,
          credits_consumed: creditCost,
          cost: creditCost,
          ai_model: aiResponse.model,
          provider: aiResponse.provider,
          generation_duration_ms: executionMs,
          api_cost: estimatedApiCost,
        } as never),
      ]);

      await AIProtectionService.markCompletion({
        userId: args.userId,
        toolId: tool.id,
        ipAddress: args.ipAddress,
        usageClass: tool.usageClass ?? "standard",
        planId: protection.planId,
        promptChars: prompt.length,
        totalTokens: tokenEstimate,
      });

      const creditsAfter = Number(debitRow?.balance_after ?? (await this.getCredits(args.userId)));
      return { executionId: execution.id, output, usage: aiResponse.usage, remainingCredits: creditsAfter, replay: false, meta };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tool execution failed.";

      if (debitTxId) {
        const { error: refundError } = await supabaseRpc.rpc("refund_user_credits", {
          p_user_id: args.userId,
          p_original_tx: debitTxId,
          p_reference: `tool_refund:${tool.id}`,
          p_execution_id: execution.id,
          p_metadata: { reason: message },
        });

        if (refundError) {
          serverLog({
            level: "error",
            route: "services/tool-execution-service.execute",
            message: "Credit refund failed after execution error.",
            error: refundError,
            metadata: {
              executionId: execution.id,
              userId: args.userId,
              toolId: tool.id,
            },
          });
        }
      }

      await Promise.all([
        supabase.from("tool_executions").update({ status: "failed", error_message: message, execution_ms: Date.now() - startedAt } as never).eq("id", execution.id),
        supabase.from("tool_usage_logs").insert({
          execution_id: execution.id,
          user_id: args.userId,
          tool_id: tool.id,
          credits_consumed: 0,
          status: "failed",
          metadata: { error: message, code: error instanceof Error ? error.name : "UnknownError" },
        } as never),
      ]);

      if (error instanceof AIProtectionError) throw error;
      throw new Error(message);
    }
  }
}
