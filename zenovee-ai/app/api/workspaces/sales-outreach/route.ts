import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonApiError, withApiErrorHandling } from "@/lib/runtime";

const createCampaignSchema = z.object({
  type: z.literal("campaign"),
  name: z.string().min(2),
  status: z.enum(["draft", "active", "paused", "archived"]).optional(),
  goal: z.string().optional(),
  targetSegment: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

const createProspectSchema = z.object({
  type: z.literal("prospect"),
  campaignId: z.string().uuid().optional(),
  fullName: z.string().min(2),
  company: z.string().optional(),
  title: z.string().optional(),
  profileUrl: z.string().optional(),
  email: z.string().email().optional(),
  status: z.enum(["new", "contacted", "replied", "qualified", "won", "lost"]).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

const createSequenceSchema = z.object({
  type: z.literal("sequence"),
  campaignId: z.string().uuid(),
  prospectId: z.string().uuid().optional(),
  name: z.string().min(2),
  channel: z.enum(["email", "linkedin", "inmail"]).optional(),
  status: z.enum(["draft", "active", "paused", "completed"]).optional(),
});

const createStepSchema = z.object({
  type: z.literal("step"),
  sequenceId: z.string().uuid(),
  stepOrder: z.number().int().min(1),
  stepType: z.enum(["icebreaker", "pitch", "objection", "follow_up", "proposal", "upsell"]),
  subject: z.string().optional(),
  message: z.string().optional(),
  delayHours: z.number().int().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const payloadSchema = z.discriminatedUnion("type", [createCampaignSchema, createProspectSchema, createSequenceSchema, createStepSchema]);

export async function GET(req: Request) {
  return withApiErrorHandling("/api/workspaces/sales-outreach:GET", async () => {
    const user = await getCurrentUser();
    if (!user) return jsonApiError("Unauthorized", 401);

    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "overview";

    if (mode === "overview") {
      const [campaigns, prospects, sequences, steps] = await Promise.all([
        supabase.from("sales_campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
        supabase.from("sales_prospects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
        supabase.from("sales_sequences").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
        supabase.from("sales_sequence_steps").select("*").eq("user_id", user.id).order("step_order", { ascending: true }).limit(500),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          campaigns: campaigns.data ?? [],
          prospects: prospects.data ?? [],
          sequences: sequences.data ?? [],
          steps: steps.data ?? [],
        },
      });
    }

    return jsonApiError("Unsupported mode", 400);
  }, "Failed to load sales outreach workspace data.");
}

export async function POST(req: Request) {
  return withApiErrorHandling("/api/workspaces/sales-outreach:POST", async () => {
    const user = await getCurrentUser();
    if (!user) return jsonApiError("Unauthorized", 401);

    const supabase = getSupabaseAdmin();
    const payload = payloadSchema.parse(await req.json());

    if (payload.type === "campaign") {
      const { data, error } = await supabase.from("sales_campaigns").insert({
        user_id: user.id,
        name: payload.name,
        status: payload.status ?? "draft",
        goal: payload.goal ?? null,
        target_segment: payload.targetSegment ?? null,
        context: payload.context ?? {},
      } as never).select("*").single();
      if (error) return jsonApiError(error.message, 400);
      return NextResponse.json({ success: true, data });
    }

    if (payload.type === "prospect") {
      const { data, error } = await supabase.from("sales_prospects").insert({
        user_id: user.id,
        campaign_id: payload.campaignId ?? null,
        full_name: payload.fullName,
        company: payload.company ?? null,
        title: payload.title ?? null,
        profile_url: payload.profileUrl ?? null,
        email: payload.email ?? null,
        status: payload.status ?? "new",
        context: payload.context ?? {},
      } as never).select("*").single();
      if (error) return jsonApiError(error.message, 400);
      return NextResponse.json({ success: true, data });
    }

    if (payload.type === "sequence") {
      const { data, error } = await supabase.from("sales_sequences").insert({
        user_id: user.id,
        campaign_id: payload.campaignId,
        prospect_id: payload.prospectId ?? null,
        name: payload.name,
        channel: payload.channel ?? "email",
        status: payload.status ?? "draft",
      } as never).select("*").single();
      if (error) return jsonApiError(error.message, 400);
      return NextResponse.json({ success: true, data });
    }

    const { data, error } = await supabase.from("sales_sequence_steps").insert({
      user_id: user.id,
      sequence_id: payload.sequenceId,
      step_order: payload.stepOrder,
      step_type: payload.stepType,
      subject: payload.subject ?? null,
      message: payload.message ?? null,
      delay_hours: payload.delayHours ?? 24,
      metadata: payload.metadata ?? {},
    } as never).select("*").single();
    if (error) return jsonApiError(error.message, 400);
    return NextResponse.json({ success: true, data });
  }, "Failed to create sales outreach record.");
}
