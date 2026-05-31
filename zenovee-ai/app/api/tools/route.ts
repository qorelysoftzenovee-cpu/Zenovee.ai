import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ToolExecutionService } from "@/services/tool-execution-service";
import { AIProtectionError } from "@/services/ai/protection";
import { AIGenerationError, toClientErrorDetails } from "@/services/ai/prompt-orchestrator";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonApiError, safeErrorMessage, withApiErrorHandling } from "@/lib/runtime";
import { serverLog } from "@/lib/logger";
import { z } from "zod";
import { checkRateLimit, resolveClientIp } from "@/lib/rate-limit";
import { getBillingSnapshot, getToolCreditRule, ToolExecutionAccessError } from "@/lib/billing/credits";

const executeToolSchema = z.object({
  toolId: z.string().min(1, "Tool id is required"),
  input: z.unknown(),
  options: z.unknown().optional(),
  workspaceId: z.string().min(1).optional().nullable(),
  moduleId: z.string().min(1).optional().nullable(),
});

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error occurred.";
}

function classifyExecutionError(error: unknown): { message: string; code: string; status: number } {
  if (error instanceof ToolExecutionAccessError) {
    if (error.code === "SUBSCRIPTION_REQUIRED") {
      return { message: "An active subscription is required to run this tool.", code: "SUBSCRIPTION_REQUIRED", status: 402 };
    }
    if (error.code === "INSUFFICIENT_CREDITS") {
      return { message: "You don't have enough credits for this generation.", code: "INSUFFICIENT_CREDITS", status: 402 };
    }
    if (error.code === "TOOL_DISABLED") {
      return { message: "This tool is temporarily unavailable.", code: "TOOL_DISABLED", status: 423 };
    }
    if (error.code === "COOLDOWN_ACTIVE") {
      return { message: error.message, code: "COOLDOWN_ACTIVE", status: 429 };
    }
  }

  const message = safeErrorMessage(error, "Tool execution failed.");
  const normalized = message.toLowerCase();

  if (normalized.includes("active subscription required")) {
    return { message: "An active subscription is required to run this tool.", code: "SUBSCRIPTION_REQUIRED", status: 402 };
  }
  if (normalized.includes("insufficient credits")) {
    return { message: "You don't have enough credits for this generation.", code: "INSUFFICIENT_CREDITS", status: 402 };
  }
  if (normalized.includes("temporarily disabled")) {
    return { message: "This tool is temporarily unavailable.", code: "TOOL_DISABLED", status: 423 };
  }
  if (normalized.includes("timed out")) {
    return { message: "The generation timed out. Please try again.", code: "TIMEOUT", status: 504 };
  }
  if (normalized.includes("please wait") && normalized.includes("before running")) {
    return { message, code: "COOLDOWN_ACTIVE", status: 429 };
  }
  if (normalized.includes("duplicate execution")) {
    return { message: "A similar generation is already running. Please wait a moment.", code: "DUPLICATE_EXECUTION", status: 409 };
  }

  return { message, code: "TOOL_EXECUTION_FAILED", status: 400 };
}

export async function POST(req: Request) {
  return withApiErrorHandling("/api/tools:POST", async () => {
    let userId: string | null = null;
    let requestedToolId: string | null = null;
    try {
      const user = await getCurrentUser();
      if (!user) {
        return jsonApiError("Unauthorized", 401);
      }
      userId = user.id;

      const payload = executeToolSchema.parse(await req.json());
      const { toolId, input, options, workspaceId, moduleId } = payload;
      requestedToolId = toolId;
      const ipAddress = resolveClientIp(req);
      const [billingSnapshot, toolRule] = await Promise.all([
        getBillingSnapshot(user.id),
        getToolCreditRule(toolId),
      ]);
      const creditsBefore = billingSnapshot.availableCredits;
      serverLog({
        level: "info",
        route: "/api/tools:POST",
        message: "Generate clicked",
        metadata: {
          userId: user.id,
          toolId,
          currentBalance: billingSnapshot.availableCredits,
          requiredCredits: toolRule.creditCost,
          planId: billingSnapshot.plan,
          status: billingSnapshot.subscriptionStatus,
          credits: billingSnapshot.availableCredits,
          subscriptionLookupResult: billingSnapshot.subscriptionLookupResult,
          denialReason: null,
          accessDeniedReason: null,
        },
      });
      const rateLimit = checkRateLimit(`tools:${user.id}:${ipAddress}`, 20, 60_000);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { success: false, error: `Too many requests. Retry in ${rateLimit.retryAfterSeconds}s.` },
          { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
        );
      }
      const idempotencyKey = req.headers.get("x-idempotency-key");

      const result = await ToolExecutionService.execute({
        userId: user.id,
        toolId,
        rawInput: input,
        options,
        workspaceId,
        moduleId,
        ipAddress,
        idempotencyKey,
      });

      return NextResponse.json({
        success: true,
        data: result.output,
        executionId: result.executionId,
        usage: result.usage,
        generationMeta: result.meta,
        metrics: {
          creditsBefore,
          creditsAfter: result.remainingCredits,
        },
      });
    } catch (error) {
      if (error instanceof AIProtectionError) {
        serverLog({ level: "warn", route: "/api/tools:POST", message: error.message });
        return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status });
      }
      if (error instanceof AIGenerationError) {
        serverLog({ level: "warn", route: "/api/tools:POST", message: error.message, metadata: error.details });
        return NextResponse.json({ success: false, error: error.message, code: error.code, details: toClientErrorDetails(error) }, { status: error.status });
      }
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: error.issues[0]?.message ?? "Invalid tool execution request." },
          { status: 400 }
        );
      }
      const classified = classifyExecutionError(error);
      const billingSnapshot = userId
        ? await getBillingSnapshot(userId)
        : {
            plan: null,
            subscriptionStatus: null,
            hasActiveSubscription: false,
            renewalAt: null,
            availableCredits: 0,
            totalCredits: 0,
            usedCredits: 0,
            subscriptionLookupResult: {
              subscriptionFound: false,
              paymentFound: false,
              rawSubscriptionStatus: null,
              fallbackActive: false,
            },
          };
      serverLog({
        level: "warn",
        route: "/api/tools:POST",
        message: "Generate denied",
        metadata: {
          userId,
          toolId: requestedToolId,
          currentBalance: error instanceof ToolExecutionAccessError ? error.currentBalance : billingSnapshot.availableCredits,
          requiredCredits: error instanceof ToolExecutionAccessError ? error.requiredCredits : null,
          planId: billingSnapshot.plan,
          status: billingSnapshot.subscriptionStatus,
          credits: billingSnapshot.availableCredits,
          subscriptionLookupResult: billingSnapshot.subscriptionLookupResult,
          denialReason: error instanceof ToolExecutionAccessError ? (error.denialReason ?? classified.code) : classified.code,
          accessDeniedReason: classified.code,
        },
      });
      return NextResponse.json(
        {
          success: false,
          error: classified.message,
          code: classified.code,
          details: error instanceof ToolExecutionAccessError
            ? {
                toolId: error.toolId,
                actualBalance: error.currentBalance,
                requiredCredits: error.requiredCredits,
                denialReason: error.denialReason ?? classified.code,
              }
            : undefined,
        },
        { status: classified.status }
      );
    }
  }, "Tool execution failed.");
}

export async function GET(req: Request) {
  return withApiErrorHandling("/api/tools:GET", async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return jsonApiError("Unauthorized", 401);
      }

      const { searchParams } = new URL(req.url);
      const mode = searchParams.get("mode") ?? "catalog";

      if (mode === "history") {
        const toolId = searchParams.get("toolId");
        const workspaceId = searchParams.get("workspaceId");
        const moduleId = searchParams.get("moduleId");
        const limit = Math.min(Number(searchParams.get("limit") ?? 10), 50);

        let query = supabaseAdmin
          .from("tool_usage")
          .select("id,tool_id,tool_name,input,output,credits_consumed,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (toolId) {
          query = query.eq("tool_id", toolId);
        }

        if (workspaceId || moduleId) {
          let logsQuery = supabaseAdmin
            .from("tool_usage_logs")
            .select("execution_id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(limit * 4);

          if (workspaceId) logsQuery = logsQuery.eq("metadata->>workspaceId", workspaceId);
          if (moduleId) logsQuery = logsQuery.eq("metadata->>moduleId", moduleId);

          const { data: scopedLogs } = await logsQuery.returns<Array<{ execution_id: string | null }>>();
          const scopedExecutionIds = (scopedLogs ?? [])
            .map((row) => row.execution_id)
            .filter((id): id is string => typeof id === "string" && id.length > 0);

          if (scopedExecutionIds.length === 0) {
            return NextResponse.json({ success: true, data: [] });
          }

          query = query.in("id", scopedExecutionIds);
        }

        const { data, error } = await query;
        if (error) {
          return jsonApiError("Failed to load usage history.", 400);
        }

        const usageIds = (data ?? []).map((item) => item.id);
        let exportRows: Array<{
          id: string;
          tool_usage_id: string | null;
          storage_path: string | null;
          file_type: string | null;
          metadata: unknown;
          created_at: string;
        }> = [];

        if (usageIds.length > 0) {
          const { data: files, error: filesError } = await supabaseAdmin
            .from("generation_history")
            .select("id,tool_usage_id,storage_path,file_type,metadata,created_at")
            .in("tool_usage_id", usageIds)
            .not("storage_path", "is", null)
            .order("created_at", { ascending: false });

          if (filesError) {
            return jsonApiError("Failed to load export history.", 400);
          }

          exportRows = files ?? [];
        }

        const exportsByUsageId = exportRows.reduce<Record<string, typeof exportRows>>((acc, item) => {
          const key = item.tool_usage_id ?? "";
          if (!key) return acc;
          acc[key] = acc[key] ?? [];
          acc[key].push(item);
          return acc;
        }, {});

        return NextResponse.json({
          success: true,
          data: (data ?? []).map((item) => ({
            ...item,
            exports: exportsByUsageId[item.id] ?? [],
          })),
        });
      }

      const tools = (await ToolExecutionService.listToolsWithPricing()).filter(
        (tool) => tool.metadata.availability === "active" && (tool.metadata.visibility ?? "public") === "public"
      );
      const workspaces = await ToolExecutionService.listWorkspacesWithPricing();
      const billingSnapshot = await getBillingSnapshot(user.id);

      return NextResponse.json({ success: true, data: { tools, workspaces, credits: billingSnapshot.availableCredits } });
    } catch (error) {
      return jsonApiError(getErrorMessage(error), 400);
    }
  }, "Failed to load tools.");
}