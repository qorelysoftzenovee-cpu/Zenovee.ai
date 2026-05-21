import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { jsonApiError, withApiErrorHandling } from "@/lib/runtime";
import { listWorkspaceConfigs } from "@/services/workspaces/registry";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type WorkspaceAdminOverride = {
  workspaceId: string;
  visibility: "public" | "private";
  audiencePresets?: string[];
  tonePresets?: string[];
  templatePresets?: string[];
  modelOverride?: string;
  promptOverride?: Record<string, unknown>;
};

type WorkspaceConfigRow = {
  workspace_id: string;
  visibility: "public" | "private";
  audience_presets: unknown;
  tone_presets: unknown;
  template_presets: unknown;
  model_override: string | null;
  prompt_override: unknown;
};

export async function GET() {
  return withApiErrorHandling("/api/admin/workspaces:GET", async () => {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const { data: configRows } = await supabase
      .from("workspace_configs")
      .select("workspace_id,visibility,audience_presets,tone_presets,template_presets,model_override,prompt_override")
      .returns<WorkspaceConfigRow[]>();

    const configMap = new Map(
      (configRows ?? []).map((row) => [row.workspace_id, row])
    );

    const data = listWorkspaceConfigs().map((workspace) => {
      const override = configMap.get(workspace.id);
      return {
        workspaceId: workspace.id,
        name: workspace.name,
        visibility: (override?.visibility as "public" | "private" | undefined) ?? "public",
        audiencePresets: Array.isArray(override?.audience_presets) ? override?.audience_presets.map(String) : workspace.audiencePresets,
        tonePresets: Array.isArray(override?.tone_presets) ? override?.tone_presets.map(String) : workspace.tonePresets,
        templatePresets: Array.isArray(override?.template_presets) ? override?.template_presets.map(String) : workspace.templatePresets,
        modelOverride: override?.model_override ?? "",
        promptOverride: (override?.prompt_override && typeof override.prompt_override === "object") ? override.prompt_override : {},
      };
    });

    return NextResponse.json({ success: true, data });
  }, "Failed to load workspace admin config.");
}

export async function PATCH(req: Request) {
  return withApiErrorHandling("/api/admin/workspaces:PATCH", async () => {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const body = (await req.json()) as WorkspaceAdminOverride;
    if (!body.workspaceId) return jsonApiError("workspaceId is required", 400);

    const normalized: WorkspaceAdminOverride = {
      workspaceId: body.workspaceId,
      visibility: body.visibility === "private" ? "private" : "public",
      audiencePresets: Array.isArray(body.audiencePresets) ? body.audiencePresets : undefined,
      tonePresets: Array.isArray(body.tonePresets) ? body.tonePresets : undefined,
      templatePresets: Array.isArray(body.templatePresets) ? body.templatePresets : undefined,
      modelOverride: typeof body.modelOverride === "string" ? body.modelOverride : undefined,
      promptOverride: body.promptOverride && typeof body.promptOverride === "object" ? body.promptOverride : undefined,
    };

    await supabase.from("workspace_configs").upsert({
      workspace_id: normalized.workspaceId,
      visibility: normalized.visibility,
      audience_presets: normalized.audiencePresets ?? [],
      tone_presets: normalized.tonePresets ?? [],
      template_presets: normalized.templatePresets ?? [],
      model_override: normalized.modelOverride ?? null,
      prompt_override: normalized.promptOverride ?? {},
    } as never);

    return NextResponse.json({ success: true, data: normalized });
  }, "Failed to update workspace admin config.");
}
