import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonApiError, withApiErrorHandling } from "@/lib/runtime";

const payloadSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("campaign"), name: z.string().min(2), funnelStage: z.string().optional(), emotionalAngle: z.string().optional(), adPlatform: z.string().optional() }),
  z.object({ type: z.literal("variant"), campaignId: z.string().uuid(), moduleId: z.string().min(2), variantName: z.string().min(2), content: z.string().min(2), metadata: z.record(z.string(), z.unknown()).optional(), isPinned: z.boolean().optional(), isFavorite: z.boolean().optional() }),
  z.object({ type: z.literal("duplicate_campaign"), campaignId: z.string().uuid(), name: z.string().min(2).optional() }),
]);

const patchSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("campaign"), id: z.string().uuid(), name: z.string().min(2).optional(), funnelStage: z.string().optional(), emotionalAngle: z.string().optional(), adPlatform: z.string().optional(), status: z.enum(["draft", "active", "archived"]).optional() }),
  z.object({ type: z.literal("variant"), id: z.string().uuid(), variantName: z.string().min(2).optional(), content: z.string().min(2).optional(), metadata: z.record(z.string(), z.unknown()).optional(), isPinned: z.boolean().optional(), isFavorite: z.boolean().optional() }),
]);

export async function GET() {
  return withApiErrorHandling("/api/workspaces/conversion-copy:GET", async () => {
    const user = await getCurrentUser();
    if (!user) return jsonApiError("Unauthorized", 401);
    const supabase = getSupabaseAdmin();
    const [campaigns, variants] = await Promise.all([
      supabase.from("conversion_campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("conversion_variants").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(500),
    ]);
    return NextResponse.json({ success: true, data: { campaigns: campaigns.data ?? [], variants: variants.data ?? [] } });
  }, "Failed to load conversion copy workspace data.");
}

export async function POST(req: Request) {
  return withApiErrorHandling("/api/workspaces/conversion-copy:POST", async () => {
    const user = await getCurrentUser();
    if (!user) return jsonApiError("Unauthorized", 401);
    const supabase = getSupabaseAdmin();
    const payload = payloadSchema.parse(await req.json());
    if (payload.type === "campaign") {
      const { data, error } = await supabase.from("conversion_campaigns").insert({ user_id: user.id, name: payload.name, funnel_stage: payload.funnelStage ?? null, emotional_angle: payload.emotionalAngle ?? null, ad_platform: payload.adPlatform ?? null } as never).select("*").single();
      if (error) return jsonApiError(error.message, 400);
      return NextResponse.json({ success: true, data });
    }
    if (payload.type === "variant") {
      const { data, error } = await supabase.from("conversion_variants").insert({ user_id: user.id, campaign_id: payload.campaignId, module_id: payload.moduleId, variant_name: payload.variantName, content: payload.content, metadata: payload.metadata ?? {}, is_pinned: payload.isPinned ?? false, is_favorite: payload.isFavorite ?? false } as never).select("*").single();
      if (error) return jsonApiError(error.message, 400);
      return NextResponse.json({ success: true, data });
    }
    const source = (await supabase.from("conversion_campaigns").select("*").eq("id", payload.campaignId).eq("user_id", user.id).single()) as { data: Record<string, unknown> | null; error: { message?: string } | null };
    if (source.error || !source.data) return jsonApiError("Campaign not found", 404);
    const duplicated = (await supabase.from("conversion_campaigns").insert({
      user_id: user.id,
      workspace_id: source.data.workspace_id as string,
      name: payload.name ?? `${String(source.data.name)} (Copy)`,
      funnel_stage: (source.data.funnel_stage as string | null) ?? null,
      emotional_angle: (source.data.emotional_angle as string | null) ?? null,
      ad_platform: (source.data.ad_platform as string | null) ?? null,
      status: "draft",
    } as never).select("*").single()) as { data: Record<string, unknown> | null; error: { message?: string } | null };
    if (duplicated.error || !duplicated.data) return jsonApiError(duplicated.error?.message ?? "Failed to duplicate campaign", 400);
    return NextResponse.json({ success: true, data: duplicated.data });
  }, "Failed to create conversion copy workspace record.");
}

export async function DELETE(req: Request) {
  return withApiErrorHandling("/api/workspaces/conversion-copy:DELETE", async () => {
    const user = await getCurrentUser();
    if (!user) return jsonApiError("Unauthorized", 401);
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    if (!type || !id) return jsonApiError("type and id are required", 400);
    const table = type === "campaign" ? "conversion_campaigns" : type === "variant" ? "conversion_variants" : null;
    if (!table) return jsonApiError("Invalid type", 400);
    const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", user.id);
    if (error) return jsonApiError(error.message, 400);
    return NextResponse.json({ success: true });
  }, "Failed to delete conversion copy workspace record.");
}

export async function PATCH(req: Request) {
  return withApiErrorHandling("/api/workspaces/conversion-copy:PATCH", async () => {
    const user = await getCurrentUser();
    if (!user) return jsonApiError("Unauthorized", 401);
    const supabase = getSupabaseAdmin();
    const payload = patchSchema.parse(await req.json());
    if (payload.type === "campaign") {
      const { id, ...rest } = payload;
      const { data, error } = await supabase.from("conversion_campaigns").update({
        name: rest.name,
        funnel_stage: rest.funnelStage,
        emotional_angle: rest.emotionalAngle,
        ad_platform: rest.adPlatform,
        status: rest.status,
      } as never).eq("id", id).eq("user_id", user.id).select("*").single();
      if (error) return jsonApiError(error.message, 400);
      return NextResponse.json({ success: true, data });
    }
    const { id, ...rest } = payload;
    const { data, error } = await supabase.from("conversion_variants").update({
      variant_name: rest.variantName,
      content: rest.content,
      metadata: rest.metadata,
      is_pinned: rest.isPinned,
      is_favorite: rest.isFavorite,
    } as never).eq("id", id).eq("user_id", user.id).select("*").single();
    if (error) return jsonApiError(error.message, 400);
    return NextResponse.json({ success: true, data });
  }, "Failed to update conversion copy workspace record.");
}
