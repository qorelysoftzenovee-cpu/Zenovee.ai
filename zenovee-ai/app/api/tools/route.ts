import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ToolExecutionService } from "@/services/tool-execution-service";
import { AIProtectionError } from "@/services/ai/protection";
import { AIGenerationError, toClientErrorDetails } from "@/services/ai/prompt-orchestrator";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonApiError, safeErrorMessage, withApiErrorHandling } from "@/lib/runtime";
import { serverLog } from "@/lib/logger";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error occurred.";
}

export async function POST(req: Request) {
  return withApiErrorHandling("/api/tools:POST", async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return jsonApiError("Unauthorized", 401);
      }

      const { toolId, input, options } = await req.json();
      const creditsBefore = await ToolExecutionService.getCredits(user.id);
      const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
      const ipAddress = forwardedFor.split(",")[0]?.trim() || "0.0.0.0";
      const idempotencyKey = req.headers.get("x-idempotency-key");

      const result = await ToolExecutionService.execute({
        userId: user.id,
        toolId,
        rawInput: input,
        options,
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
      return jsonApiError(safeErrorMessage(error, "Tool execution failed."), 400);
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
      const credits = await ToolExecutionService.getCredits(user.id);

      return NextResponse.json({ success: true, data: { tools, credits } });
    } catch (error) {
      return jsonApiError(getErrorMessage(error), 400);
    }
  }, "Failed to load tools.");
}