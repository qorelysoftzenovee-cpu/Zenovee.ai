import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonApiError, withApiErrorHandling } from "@/lib/runtime";

const createProjectSchema = z.object({
  type: z.literal("project"),
  name: z.string().min(2),
  stylePreset: z.string().optional(),
  designSystemPreset: z.string().optional(),
  status: z.enum(["active", "archived"]).optional(),
});

const createGenerationSchema = z.object({
  type: z.literal("generation"),
  projectId: z.string().uuid(),
  assetType: z.string().min(2),
  modelProvider: z.enum(["togetherai", "flux", "sdxl"]).optional(),
  modelName: z.string().min(2),
  prompt: z.string().min(2),
  beforeReference: z.string().optional(),
  outputReference: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["generated", "failed"]).optional(),
});

const createGalleryItemSchema = z.object({
  type: z.literal("gallery-item"),
  generationId: z.string().uuid(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
});

const payloadSchema = z.discriminatedUnion("type", [createProjectSchema, createGenerationSchema, createGalleryItemSchema]);

const patchGallerySchema = z.object({
  galleryItemId: z.string().uuid(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  return withApiErrorHandling("/api/workspaces/brand-studio:GET", async () => {
    const user = await getCurrentUser();
    if (!user) return jsonApiError("Unauthorized", 401);

    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "overview";

    if (mode !== "overview") return jsonApiError("Unsupported mode", 400);

    const [projects, generations, gallery] = await Promise.all([
      supabase.from("brand_studio_projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("brand_studio_generations").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(300),
      supabase.from("brand_studio_gallery_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(500),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        projects: projects.data ?? [],
        generations: generations.data ?? [],
        gallery: gallery.data ?? [],
      },
    });
  }, "Failed to load brand studio workspace data.");
}

export async function POST(req: Request) {
  return withApiErrorHandling("/api/workspaces/brand-studio:POST", async () => {
    const user = await getCurrentUser();
    if (!user) return jsonApiError("Unauthorized", 401);

    const supabase = getSupabaseAdmin();
    const payload = payloadSchema.parse(await req.json());

    if (payload.type === "project") {
      const { data, error } = await supabase.from("brand_studio_projects").insert({
        user_id: user.id,
        name: payload.name,
        style_preset: payload.stylePreset ?? null,
        design_system_preset: payload.designSystemPreset ?? null,
        status: payload.status ?? "active",
      } as never).select("*").single();
      if (error) return jsonApiError(error.message, 400);
      return NextResponse.json({ success: true, data });
    }

    if (payload.type === "generation") {
      const { data, error } = await supabase.from("brand_studio_generations").insert({
        user_id: user.id,
        project_id: payload.projectId,
        asset_type: payload.assetType,
        model_provider: payload.modelProvider ?? "togetherai",
        model_name: payload.modelName,
        prompt: payload.prompt,
        before_reference: payload.beforeReference ?? null,
        output_reference: payload.outputReference ?? null,
        metadata: payload.metadata ?? {},
        status: payload.status ?? "generated",
      } as never).select("*").single();
      if (error) return jsonApiError(error.message, 400);
      return NextResponse.json({ success: true, data });
    }

    const { data, error } = await supabase.from("brand_studio_gallery_items").insert({
      user_id: user.id,
      generation_id: payload.generationId,
      is_pinned: payload.isPinned ?? false,
      is_favorite: payload.isFavorite ?? false,
      title: payload.title ?? null,
      notes: payload.notes ?? null,
    } as never).select("*").single();
    if (error) return jsonApiError(error.message, 400);
    return NextResponse.json({ success: true, data });
  }, "Failed to create brand studio workspace record.");
}

export async function PATCH(req: Request) {
  return withApiErrorHandling("/api/workspaces/brand-studio:PATCH", async () => {
    const user = await getCurrentUser();
    if (!user) return jsonApiError("Unauthorized", 401);

    const supabase = getSupabaseAdmin();
    const body = patchGallerySchema.parse(await req.json());

    const { data, error } = await supabase
      .from("brand_studio_gallery_items")
      .update({
        is_pinned: body.isPinned,
        is_favorite: body.isFavorite,
        title: body.title,
        notes: body.notes,
      } as never)
      .eq("id", body.galleryItemId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) return jsonApiError(error.message, 400);
    return NextResponse.json({ success: true, data });
  }, "Failed to update brand studio gallery item.");
}
