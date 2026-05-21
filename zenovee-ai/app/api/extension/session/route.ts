import { NextResponse } from "next/server";
import { getExtensionUser } from "@/lib/extension-auth";
import { listToolDefinitions } from "@/definitions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ToolExecutionService } from "@/services/tool-execution-service";
import { jsonApiError, withApiErrorHandling } from "@/lib/runtime";

function extensionToolCatalog() {
  return listToolDefinitions()
    .filter((tool) =>
      [
        "browser-rewrite",
        "browser-summarize",
        "browser-improve-writing",
        "browser-seo-helper",
        "browser-ad-copy",
      ].includes(tool.id)
    )
    .map(({ id, metadata, creditCost, fields, usageClass, exportFormats }) => ({
      id,
      metadata,
      creditCost,
      fields,
      usageClass: usageClass ?? "standard",
      exportFormats: exportFormats ?? ["json"],
    }));
}

export async function GET(request: Request) {
  return withApiErrorHandling("/api/extension/session:GET", async () => {
    const user = await getExtensionUser(request);

    if (!user) {
      return jsonApiError("Unauthorized", 401);
    }

    const credits = await ToolExecutionService.getCredits(user.id);
    const { data: history, error } = await supabaseAdmin
      .from("tool_usage")
      .select("id,tool_id,tool_name,output,credits_consumed,created_at")
      .eq("user_id", user.id)
      .in("tool_id", [
        "browser-rewrite",
        "browser-summarize",
        "browser-improve-writing",
        "browser-seo-helper",
        "browser-ad-copy",
      ])
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      return jsonApiError("Unable to load your extension workspace right now.", 400);
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        credits,
        tools: extensionToolCatalog(),
        history: history ?? [],
      },
    });
  }, "Unable to load your extension workspace right now.");
}