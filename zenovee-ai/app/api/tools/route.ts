import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ToolEngine } from "@/engine";
import { CreditService } from "@/credit-service";
import { AIProtectionError } from "@/services/ai/protection";
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

      const { toolId, input } = await req.json();
      const creditsBefore = await CreditService.getCredits(user.id);
      const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
      const ipAddress = forwardedFor.split(",")[0]?.trim() || "0.0.0.0";

      const engine = new ToolEngine(user.id);
      const result = await engine.executeTool(toolId, input, ipAddress);

      return NextResponse.json({
        success: true,
        data: result.output,
        executionId: result.executionId,
        usage: result.usage,
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

      const engine = new ToolEngine(user.id);
      const tools = engine.getToolList();
      const credits = await CreditService.getCredits(user.id);

      return NextResponse.json({ success: true, data: { tools, credits } });
    } catch (error) {
      return jsonApiError(getErrorMessage(error), 400);
    }
  }, "Failed to load tools.");
}