import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { jsonApiError, withApiErrorHandling } from "@/lib/runtime";

const createProjectSchema = z.object({
  type: z.literal("project"),
  name: z.string().min(2),
  primaryTopic: z.string().min(2),
  targetMarket: z.string().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
});

const createClusterSchema = z.object({
  type: z.literal("cluster"),
  projectId: z.string().uuid(),
  clusterName: z.string().min(2),
  intent: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  priority: z.number().int().min(1).max(5).optional(),
});

const createPlanSchema = z.object({
  type: z.literal("plan"),
  projectId: z.string().uuid(),
  clusterId: z.string().uuid().optional(),
  title: z.string().min(2),
  slug: z.string().optional(),
  outlineMarkdown: z.string().optional(),
  faqSchema: z.array(z.record(z.string(), z.unknown())).optional(),
  internalLinks: z.array(z.string()).optional(),
  status: z.enum(["planned", "drafting", "published"]).optional(),
});

const payloadSchema = z.discriminatedUnion("type", [createProjectSchema, createClusterSchema, createPlanSchema]);

export async function GET(req: Request) {
  return withApiErrorHandling("/api/workspaces/seo-growth:GET", async () => {
    const user = await getCurrentUser();
    if (!user) return jsonApiError("Unauthorized", 401);

    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "overview";

    if (mode !== "overview") return jsonApiError("Unsupported mode", 400);

    const [projects, clusters, plans] = await Promise.all([
      supabase.from("seo_projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("seo_keyword_clusters").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(300),
      supabase.from("seo_article_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(300),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        projects: projects.data ?? [],
        clusters: clusters.data ?? [],
        plans: plans.data ?? [],
      },
    });
  }, "Failed to load SEO growth workspace data.");
}

export async function POST(req: Request) {
  return withApiErrorHandling("/api/workspaces/seo-growth:POST", async () => {
    const user = await getCurrentUser();
    if (!user) return jsonApiError("Unauthorized", 401);

    const supabase = getSupabaseAdmin();
    const payload = payloadSchema.parse(await req.json());

    if (payload.type === "project") {
      const { data, error } = await supabase.from("seo_projects").insert({
        user_id: user.id,
        name: payload.name,
        primary_topic: payload.primaryTopic,
        target_market: payload.targetMarket ?? null,
        status: payload.status ?? "draft",
      } as never).select("*").single();
      if (error) return jsonApiError(error.message, 400);
      return NextResponse.json({ success: true, data });
    }

    if (payload.type === "cluster") {
      const { data, error } = await supabase.from("seo_keyword_clusters").insert({
        user_id: user.id,
        project_id: payload.projectId,
        cluster_name: payload.clusterName,
        intent: payload.intent ?? null,
        keywords: payload.keywords,
        priority: payload.priority ?? 3,
      } as never).select("*").single();
      if (error) return jsonApiError(error.message, 400);
      return NextResponse.json({ success: true, data });
    }

    const { data, error } = await supabase.from("seo_article_plans").insert({
      user_id: user.id,
      project_id: payload.projectId,
      cluster_id: payload.clusterId ?? null,
      title: payload.title,
      slug: payload.slug ?? null,
      outline_markdown: payload.outlineMarkdown ?? null,
      faq_schema: payload.faqSchema ?? [],
      internal_links: payload.internalLinks ?? [],
      status: payload.status ?? "planned",
    } as never).select("*").single();
    if (error) return jsonApiError(error.message, 400);
    return NextResponse.json({ success: true, data });
  }, "Failed to create SEO growth workspace record.");
}
