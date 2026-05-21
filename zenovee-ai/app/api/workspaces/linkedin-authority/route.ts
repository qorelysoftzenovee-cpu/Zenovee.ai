import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonApiError, withApiErrorHandling } from "@/lib/runtime";

const payloadSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("project"), name: z.string().min(2), audiencePreset: z.string().optional(), tonePreset: z.string().optional(), templatePreset: z.string().optional() }),
  z.object({ type: z.literal("draft"), projectId: z.string().uuid(), moduleId: z.string().min(2), title: z.string().optional(), content: z.string().min(2), metadata: z.record(z.string(), z.unknown()).optional(), isPinned: z.boolean().optional(), isFavorite: z.boolean().optional() }),
  z.object({ type: z.literal("duplicate_project"), projectId: z.string().uuid(), name: z.string().min(2).optional() }),
]);

const patchSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("project"), id: z.string().uuid(), name: z.string().min(2).optional(), status: z.enum(["active", "archived"]).optional(), audiencePreset: z.string().optional(), tonePreset: z.string().optional(), templatePreset: z.string().optional() }),
  z.object({ type: z.literal("draft"), id: z.string().uuid(), title: z.string().optional(), content: z.string().min(2).optional(), metadata: z.record(z.string(), z.unknown()).optional(), isPinned: z.boolean().optional(), isFavorite: z.boolean().optional() }),
]);

export async function GET() {
  return withApiErrorHandling("/api/workspaces/linkedin-authority:GET", async () => {
    const user = await getCurrentUser();
    if (!user) return jsonApiError("Unauthorized", 401);
    const supabase = getSupabaseAdmin();
    const [projects, drafts] = await Promise.all([
      supabase.from("linkedin_projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("linkedin_drafts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(500),
    ]);
    return NextResponse.json({ success: true, data: { projects: projects.data ?? [], drafts: drafts.data ?? [] } });
  }, "Failed to load linkedin authority workspace data.");
}

export async function POST(req: Request) {
  return withApiErrorHandling("/api/workspaces/linkedin-authority:POST", async () => {
    const user = await getCurrentUser();
    if (!user) return jsonApiError("Unauthorized", 401);
    const supabase = getSupabaseAdmin();
    const payload = payloadSchema.parse(await req.json());
    if (payload.type === "project") {
      const { data, error } = await supabase.from("linkedin_projects").insert({ user_id: user.id, name: payload.name, audience_preset: payload.audiencePreset ?? null, tone_preset: payload.tonePreset ?? null, template_preset: payload.templatePreset ?? null } as never).select("*").single();
      if (error) return jsonApiError(error.message, 400);
      return NextResponse.json({ success: true, data });
    }
    if (payload.type === "draft") {
      const { data, error } = await supabase.from("linkedin_drafts").insert({ user_id: user.id, project_id: payload.projectId, module_id: payload.moduleId, title: payload.title ?? null, content: payload.content, metadata: payload.metadata ?? {}, is_pinned: payload.isPinned ?? false, is_favorite: payload.isFavorite ?? false } as never).select("*").single();
      if (error) return jsonApiError(error.message, 400);
      return NextResponse.json({ success: true, data });
    }
    const source = (await supabase.from("linkedin_projects").select("*").eq("id", payload.projectId).eq("user_id", user.id).single()) as { data: Record<string, unknown> | null; error: { message?: string } | null };
    if (source.error || !source.data) return jsonApiError("Project not found", 404);
    const duplicated = (await supabase.from("linkedin_projects").insert({
      user_id: user.id,
      workspace_id: source.data.workspace_id as string,
      name: payload.name ?? `${String(source.data.name)} (Copy)`,
      audience_preset: (source.data.audience_preset as string | null) ?? null,
      tone_preset: (source.data.tone_preset as string | null) ?? null,
      template_preset: (source.data.template_preset as string | null) ?? null,
      status: "active",
    } as never).select("*").single()) as { data: Record<string, unknown> | null; error: { message?: string } | null };
    if (duplicated.error || !duplicated.data) return jsonApiError(duplicated.error?.message ?? "Failed to duplicate project", 400);
    return NextResponse.json({ success: true, data: duplicated.data });
  }, "Failed to create linkedin authority workspace record.");
}

export async function DELETE(req: Request) {
  return withApiErrorHandling("/api/workspaces/linkedin-authority:DELETE", async () => {
    const user = await getCurrentUser();
    if (!user) return jsonApiError("Unauthorized", 401);
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    if (!type || !id) return jsonApiError("type and id are required", 400);
    const table = type === "project" ? "linkedin_projects" : type === "draft" ? "linkedin_drafts" : null;
    if (!table) return jsonApiError("Invalid type", 400);
    const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", user.id);
    if (error) return jsonApiError(error.message, 400);
    return NextResponse.json({ success: true });
  }, "Failed to delete linkedin authority workspace record.");
}

export async function PATCH(req: Request) {
  return withApiErrorHandling("/api/workspaces/linkedin-authority:PATCH", async () => {
    const user = await getCurrentUser();
    if (!user) return jsonApiError("Unauthorized", 401);
    const supabase = getSupabaseAdmin();
    const payload = patchSchema.parse(await req.json());
    if (payload.type === "project") {
      const { id, ...rest } = payload;
      const { data, error } = await supabase.from("linkedin_projects").update({
        name: rest.name,
        status: rest.status,
        audience_preset: rest.audiencePreset,
        tone_preset: rest.tonePreset,
        template_preset: rest.templatePreset,
      } as never).eq("id", id).eq("user_id", user.id).select("*").single();
      if (error) return jsonApiError(error.message, 400);
      return NextResponse.json({ success: true, data });
    }
    const { id, ...rest } = payload;
    const { data, error } = await supabase.from("linkedin_drafts").update({
      title: rest.title,
      content: rest.content,
      metadata: rest.metadata,
      is_pinned: rest.isPinned,
      is_favorite: rest.isFavorite,
    } as never).eq("id", id).eq("user_id", user.id).select("*").single();
    if (error) return jsonApiError(error.message, 400);
    return NextResponse.json({ success: true, data });
  }, "Failed to update linkedin authority workspace record.");
}
