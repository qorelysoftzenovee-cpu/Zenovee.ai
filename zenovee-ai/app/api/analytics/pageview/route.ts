import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const forwardedFor = req.headers.get("x-forwarded-for") ?? "";
    const ipAddress = forwardedFor.split(",")[0]?.trim() || null;

    await supabaseAdmin.from("seo_analytics_events").insert({
      event_type: body.event ? "conversion" : "pageview",
      page_path: body.path ?? "/",
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