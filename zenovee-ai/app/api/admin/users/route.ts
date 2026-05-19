import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const updateSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["add_credits", "remove_credits", "suspend", "ban", "activate", "reset_usage"]),
  credits: z.number().int().optional(),
});

export async function GET(request: Request) {
  await requireAdmin();
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  let usersQuery = supabase.from("users").select("id,email,name,role,status,credits_balance,created_at,last_login_at").order("created_at", { ascending: false }).limit(100);
  if (q) usersQuery = usersQuery.or(`email.ilike.%${q}%,name.ilike.%${q}%`);

  const { data: users } = await usersQuery;
  return NextResponse.json({ users: users ?? [] });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  const body = updateSchema.parse(await request.json());
  const supabase = getSupabaseAdmin();

  if (body.action === "suspend" || body.action === "ban" || body.action === "activate") {
    const status = body.action === "suspend" ? "SUSPENDED" : body.action === "ban" ? "BANNED" : "ACTIVE";
    await supabase.from("users").update({ status, updated_at: new Date().toISOString() } as never).eq("id", body.userId);
  }

  if (body.action === "add_credits" || body.action === "remove_credits") {
    const { data: current } = await supabase.from("users").select("credits_balance").eq("id", body.userId).maybeSingle<{ credits_balance: number }>();
    const delta = Math.abs(body.credits ?? 0) * (body.action === "add_credits" ? 1 : -1);
    const next = Math.max(0, Number(current?.credits_balance ?? 0) + delta);
    await supabase.from("users").update({ credits_balance: next, updated_at: new Date().toISOString() } as never).eq("id", body.userId);
  }

  if (body.action === "reset_usage") {
    await supabase.from("tool_usage").delete().eq("user_id", body.userId);
    await supabase.from("user_credits").update({ used_credits: 0, available_credits: 0, total_credits: 0 } as never).eq("user_id", body.userId);
  }

  await supabase.from("admin_logs").insert({
    admin_user_id: admin.id,
    target_user_id: body.userId,
    action: body.action,
    credit_change: body.credits ?? null,
    payload: body as never,
  } as never);

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  const form = await request.formData();
  const userId = String(form.get("userId") ?? "");
  const action = String(form.get("action") ?? "") as "add_credits" | "remove_credits" | "suspend" | "ban" | "activate" | "reset_usage";
  const credits = Number(form.get("credits") ?? 0);

  const parsed = updateSchema.safeParse({ userId, action, credits: Number.isFinite(credits) ? credits : undefined });
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const body = parsed.data;
  const supabase = getSupabaseAdmin();

  if (body.action === "suspend" || body.action === "ban" || body.action === "activate") {
    const status = body.action === "suspend" ? "SUSPENDED" : body.action === "ban" ? "BANNED" : "ACTIVE";
    await supabase.from("users").update({ status, updated_at: new Date().toISOString() } as never).eq("id", body.userId);
  }

  if (body.action === "add_credits" || body.action === "remove_credits") {
    const { data: current } = await supabase.from("users").select("credits_balance").eq("id", body.userId).maybeSingle<{ credits_balance: number }>();
    const delta = Math.abs(body.credits ?? 0) * (body.action === "add_credits" ? 1 : -1);
    const next = Math.max(0, Number(current?.credits_balance ?? 0) + delta);
    await supabase.from("users").update({ credits_balance: next, updated_at: new Date().toISOString() } as never).eq("id", body.userId);
  }

  if (body.action === "reset_usage") {
    await supabase.from("tool_usage").delete().eq("user_id", body.userId);
    await supabase.from("user_credits").update({ used_credits: 0, available_credits: 0, total_credits: 0 } as never).eq("user_id", body.userId);
  }

  await supabase.from("admin_logs").insert({ admin_user_id: admin.id, target_user_id: body.userId, action: body.action, credit_change: body.credits ?? null } as never);
  return NextResponse.redirect(new URL("/admin/users", request.url));
}
