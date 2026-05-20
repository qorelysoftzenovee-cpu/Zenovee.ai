import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

const analyticsEventSchema = z.object({
  path: z.string().max(2048).optional(),
  search: z.string().max(2048).optional(),
  referrer: z.string().max(2048).optional(),
  title: z.string().max(300).optional(),
  event: z.string().max(120).optional(),
  label: z.string().max(300).optional(),
});

export async function POST(req: Request) {
  try {
    const body = analyticsEventSchema.parse(await req.json());
    const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
    const ipAddress = forwardedFor.split(",")[0]?.trim() || null;
    const normalizedPath = body.path?.startsWith("/") ? body.path : "/";

    await supabaseAdmin.from("seo_analytics_events").insert({
      event_type: body.event ? "conversion" : "pageview",
      page_path: normalizedPath,
      referrer: body.referrer ?? null,
      event_label: body.label ?? body.title ?? null,
      metadata: {
        search: body.search ?? "",
        title: body.title ?? null,
        event: body.event ?? null,
      },
      ip_address: ipAddress,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}