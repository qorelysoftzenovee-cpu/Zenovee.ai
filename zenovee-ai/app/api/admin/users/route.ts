import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, requireAdminApi } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const updateSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(["suspend", "ban", "activate"]),
  credits: z.number().int().optional(),
});

export async function GET(request: Request) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  let usersQuery = supabase.from("users").select("id,email,name,role,status,credits_balance,created_at,last_login_at").order("created_at", { ascending: false }).limit(100);
  if (q) usersQuery = usersQuery.or(`email.ilike.%${q}%,name.ilike.%${q}%`);

  const { data: users } = await usersQuery;
  return NextResponse.json({ users: users ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi();
  if ("response" in auth) return auth.response;
  const admin = auth.user;
  const body = updateSchema.parse(await request.json());
  const supabase = getSupabaseAdmin();

  if (body.action === "suspend" || body.action === "ban" || body.action === "activate") {
    const status = body.action === "suspend" ? "SUSPENDED" : body.action === "ban" ? "BANNED" : "ACTIVE";
    await supabase.from("users").update({ status, updated_at: new Date().toISOString() } as never).eq("id", body.userId);
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
  const action = String(form.get("action") ?? "") as "suspend" | "ban" | "activate";
  const credits = Number(form.get("credits") ?? 0);

  const parsed = updateSchema.safeParse({ userId, action, credits: Number.isFinite(credits) ? credits : undefined });
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const body = parsed.data;
  const supabase = getSupabaseAdmin();

  if (body.action === "suspend" || body.action === "ban" || body.action === "activate") {
    const status = body.action === "suspend" ? "SUSPENDED" : body.action === "ban" ? "BANNED" : "ACTIVE";
    await supabase.from("users").update({ status, updated_at: new Date().toISOString() } as never).eq("id", body.userId);
  }

  await supabase.from("admin_logs").insert({ admin_user_id: admin.id, target_user_id: body.userId, action: body.action, credit_change: body.credits ?? null } as never);
  return NextResponse.redirect(new URL("/admin/users", request.url));
}
