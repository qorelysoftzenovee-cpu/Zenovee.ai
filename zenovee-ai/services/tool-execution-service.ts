import { getToolDefinition, listToolDefinitions } from "@/definitions";
import { AIProtectionError, AIProtectionService } from "@/services/ai/protection";
import { generationExecutionOptionsSchema, getToolPromptControlCatalog, getToolPromptProfile } from "@/services/ai/prompt-system";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import type { ToolDefinition } from "@/types/tools";
import { listWorkspaceConfigs } from "@/services/workspaces/registry";
import { serverLog } from "@/lib/logger";
import { canUseTool, getBillingSnapshot, getToolCreditRule, ToolExecutionAccessError } from "@/lib/billing/credits";
import { PromptBuilderService } from "@/services/execution/prompt-builder-service";
import { AIExecutionService } from "@/services/execution/ai-execution-service";
import { OutputValidationService } from "@/services/execution/output-validation-service";
import { ToolFormattingService } from "@/services/execution/tool-formatting-service";
import { RetryService } from "@/services/execution/retry-service";
import { ExecutionMetricsService } from "@/services/execution/execution-metrics-service";

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

const TRANSIENT_ERROR_PATTERNS = ["timed out", "timeout", "rate limit", "429", "overloaded", "temporarily unavailable"];

function isTransientError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? "").toLowerCase();
  return TRANSIENT_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

export class ToolExecutionService {
  static async getCredits(userId: string) {
    const snapshot = await getBillingSnapshot(userId);
    return snapshot.availableCredits;
  }

  static async listToolsWithPricing() {
    const supabase = getSupabaseAdmin();
    const defs = listToolDefinitions();
    const { data: pricesRaw } = await supabase.from("tool_pricing").select("tool_id,credits_cost,is_active,cooldown_seconds,metadata");
    const prices = (pricesRaw ?? []) as Array<{ tool_id: string; credits_cost: number; is_active: boolean; cooldown_seconds: number; metadata?: Record<string, unknown> | null }>;
    const map = new Map(prices.map((p) => [p.tool_id, p]));

    return defs.map((d) => {
      const price = map.get(d.id);
      const generationControls = getToolPromptControlCatalog(d.id, d.metadata.category);
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

    const promptProfile = getToolPromptProfile(tool.id, tool.metadata.category);
    serverLog({
      level: "info",
      route: "services/tool-execution-service.execute",
      message: "Tool execution pipeline starting",
      metadata: {
        toolId: tool.id,
        category: tool.metadata.category,
        workspaceId: args.workspaceId ?? null,
        moduleId: args.moduleId ?? null,
        hasPromptProfile: Boolean(promptProfile),
        promptProfileVersion: promptProfile?.version ?? null,
        fieldCount: tool.fields.length,
      },
    });

    const toolAccess = await canUseTool(args.userId, tool.id);
    serverLog({
      level: toolAccess.allowed ? "info" : "warn",
      route: "services/tool-execution-service.execute",
      message: "Tool entitlement evaluated",
      metadata: {
        userId: args.userId,
        toolId: tool.id,
        allowed: toolAccess.allowed,
        code: toolAccess.code,
        denialReason: toolAccess.denialReason ?? null,
        planId: toolAccess.billing.plan,
        status: toolAccess.billing.subscriptionStatus,
        credits: toolAccess.remainingCredits,
        subscriptionLookupResult: toolAccess.billing.subscriptionLookupResult,
      },
    });
    if (!toolAccess.allowed) {
      throw new ToolExecutionAccessError({
        message:
          toolAccess.code === "SUBSCRIPTION_REQUIRED"
            ? "Active subscription required."
            : toolAccess.code === "INSUFFICIENT_CREDITS"
            ? "Insufficient credits for this tool execution."
            : toolAccess.code === "COOLDOWN_ACTIVE"
            ? (toolAccess.message ?? "Tool cooldown active.")
            : "This tool is temporarily disabled by admin.",
        code: toolAccess.code,
        denialReason: toolAccess.denialReason,
        toolId: tool.id,
        currentBalance: toolAccess.remainingCredits,
        requiredCredits: toolAccess.creditCost,
      });
    }

    const { data: priceRaw } = await supabase
      .from("tool_pricing")
      .select("credits_cost,is_active,cooldown_seconds,metadata")
      .eq("tool_id", tool.id)
      .maybeSingle<{ credits_cost: number; is_active: boolean; cooldown_seconds: number; metadata: Record<string, unknown> | null }>();

    const price = priceRaw as { credits_cost: number; is_active: boolean; cooldown_seconds: number; metadata: Record<string, unknown> | null } | null;
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
    serverLog({
      level: "info",
      route: "services/tool-execution-service.execute",
      message: "Tool input validated",
      metadata: {
        toolId: tool.id,
        inputKeys: Object.keys(validatedInput),
        mode: executionOptions.mode,
      },
    });
    const promptPayload = PromptBuilderService.buildOptimizedPrompt({
      tool: tool as ToolDefinition<Record<string, unknown>, Record<string, unknown>>,
      input: validatedInput,
      options: executionOptions,
      adminOverrides: price?.metadata,
    });

    const protection = await AIProtectionService.validateBeforeGeneration({
      userId: args.userId,
      toolId: tool.id,
      usageClass: tool.usageClass ?? "standard",
      prompt: promptPayload.prompt,
      input: validatedInput,
      ipAddress: args.ipAddress,
      entitlement: toolAccess.billing,
    });

    const toolRule = await getToolCreditRule(tool.id);
    const creditCost = Number(toolRule.creditCost);
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

    if (debitTxId) {
      await supabase.from("credit_execution_audit").insert({
        execution_id: execution.id,
        user_id: args.userId,
        tool_id: tool.id,
        idempotency_key: idempotencyKey,
        phase: "reserved",
        credit_transaction_id: debitTxId,
        credits: creditCost,
        metadata: {
          reference: `tool:${tool.id}`,
          workspaceId: args.workspaceId ?? null,
          moduleId: args.moduleId ?? null,
        },
      } as never);
    }

    const startedAt = Date.now();
    try {
      const maxValidationRetries = Math.max(0, Number((price?.metadata as Record<string, unknown> | null)?.maxValidationRetries ?? 1));
      const totalAttempts = Math.min(4, maxValidationRetries + 1);
      const retryResult = await RetryService.run(
        async () =>
          AIExecutionService.execute({
            tool: tool as ToolDefinition<Record<string, unknown>, Record<string, unknown>>,
            input: validatedInput,
            options: executionOptions,
            adminOverrides: price?.metadata,
          }),
        {
          maxAttempts: totalAttempts,
          baseDelayMs: 400,
          isRetryable: (error) => AIExecutionService.isRetryable(error) || isTransientError(error),
        }
      );

      const generation = retryResult.value;

      const { aiResponse, output, meta } = generation;
      const validatedOutput = OutputValidationService.validateStructuredOutput(
        tool as ToolDefinition<Record<string, unknown>, Record<string, unknown>>,
        output
      );
      const premiumOutput = ToolFormattingService.formatPremiumOutput(tool.metadata.name, validatedOutput);

      const executionMetrics = ExecutionMetricsService.build({
        startedAt,
        attempts: retryResult.attempts,
        model: aiResponse.model,
        creditsConsumed: creditCost,
      });
      const executionMs = executionMetrics.durationMs;
      const tokenEstimate = Number(aiResponse.usage.totalTokens ?? 0);
      const estimatedApiCost = Number(aiResponse.costUsd ?? 0);

      await Promise.all([
        supabase.from("tool_executions").update({
          status: "success",
          output: premiumOutput,
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
            retries: executionMetrics.retries,
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
          output: premiumOutput as Json,
          credits_consumed: creditCost,
          cost: creditCost,
          ai_model: aiResponse.model,
          provider: aiResponse.provider,
          generation_duration_ms: executionMs,
          api_cost: estimatedApiCost,
        } as never),
        supabase.from("credit_execution_audit").insert({
          execution_id: execution.id,
          user_id: args.userId,
          tool_id: tool.id,
          idempotency_key: idempotencyKey,
          phase: "finalized",
          credit_transaction_id: debitTxId ?? null,
          credits: creditCost,
          metadata: {
            provider: aiResponse.provider,
            model: aiResponse.model,
            executionMs,
            retries: executionMetrics.retries,
          },
        } as never),
      ]);

      await AIProtectionService.markCompletion({
        userId: args.userId,
        toolId: tool.id,
        ipAddress: args.ipAddress,
        usageClass: tool.usageClass ?? "standard",
        planId: protection.planId,
        promptChars: promptPayload.promptChars,
        totalTokens: tokenEstimate,
      });

      const creditsAfter = Number(debitRow?.balance_after ?? (await this.getCredits(args.userId)));
      return { executionId: execution.id, output: premiumOutput, usage: aiResponse.usage, remainingCredits: creditsAfter, replay: false, meta: { ...meta, retries: executionMetrics.retries } };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tool execution failed.";
      serverLog({
        level: "error",
        route: "services/tool-execution-service.execute",
        message: "Tool execution pipeline failed",
        error,
        metadata: {
          toolId: tool.id,
          category: tool.metadata.category,
          workspaceId: args.workspaceId ?? null,
          moduleId: args.moduleId ?? null,
          promptProfileVersion: promptProfile?.version ?? null,
        },
      });

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
          await supabase.from("credit_execution_audit").insert({
            execution_id: execution.id,
            user_id: args.userId,
            tool_id: tool.id,
            idempotency_key: idempotencyKey,
            phase: "failed",
            credit_transaction_id: debitTxId,
            credits: creditCost,
            metadata: { refundError: refundError.message, reason: message },
          } as never);
        } else {
          await supabase.from("credit_execution_audit").insert({
            execution_id: execution.id,
            user_id: args.userId,
            tool_id: tool.id,
            idempotency_key: idempotencyKey,
            phase: "refunded",
            credit_transaction_id: debitTxId,
            credits: creditCost,
            metadata: { reason: message },
          } as never);
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
