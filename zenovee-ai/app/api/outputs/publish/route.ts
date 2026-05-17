import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { absoluteUrl } from "@/lib/seo/site";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { toolUsageId, title, description } = await req.json();
    if (!toolUsageId) {
      return NextResponse.json({ error: "toolUsageId is required." }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("generation_history")
      .select("id,metadata")
      .eq("user_id", user.id)
      .eq("tool_usage_id", toolUsageId)
      .is("storage_path", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 400 });
    }

    const slug = `${toolUsageId.slice(0, 8)}-${randomUUID().slice(0, 8)}`;
    const metadata = {
      ...(typeof existing?.metadata === "object" && existing.metadata ? existing.metadata : {}),
      isPublic: true,
      publicSlug: slug,
      publishedTitle: title || null,
      publishedDescription: description || null,
      publishedAt: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error } = await supabaseAdmin.from("generation_history").update({ metadata }).eq("id", existing.id).eq("user_id", user.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      const { data: usage, error: usageError } = await supabaseAdmin
        .from("tool_usage")
        .select("tool_id,output")
        .eq("id", toolUsageId)
        .eq("user_id", user.id)
        .single();

      if (usageError || !usage) {
        return NextResponse.json({ error: usageError?.message ?? "Output not found." }, { status: 400 });
      }

      const { error } = await supabaseAdmin.from("generation_history").insert({
        user_id: user.id,
        tool_usage_id: toolUsageId,
        tool_id: usage.tool_id,
        output: typeof usage.output === "string" ? usage.output : JSON.stringify(usage.output),
        metadata,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, data: { slug, url: absoluteUrl(`/outputs/${slug}`) } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status: 400 });
  }
}