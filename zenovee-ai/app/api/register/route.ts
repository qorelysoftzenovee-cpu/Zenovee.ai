import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const payload = registerSchema.parse(await request.json());
    const email = payload.email.toLowerCase().trim();

    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle<{ id: string }>();
    if (existingUser?.id) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const { data: createdAuth, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: payload.password,
      email_confirm: true,
      user_metadata: { name: payload.name.trim() },
    });

    if (authError || !createdAuth.user) {
      return NextResponse.json({ error: authError?.message ?? "Unable to create auth account." }, { status: 400 });
    }

    const userId = createdAuth.user.id;

    const { error: profileError } = await supabaseAdmin.from("users").insert({
      id: userId,
      email,
      name: payload.name.trim(),
      role: "user",
      status: "ACTIVE",
      plan: "starter",
      credits_balance: 0,
      signup_date: new Date().toISOString(),
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      if (profileError.message.includes("Could not find the table 'public.users'")) {
        return NextResponse.json(
          { error: "Database is not initialized. Run supabase/bootstrap.sql in Supabase SQL Editor." },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    const { error: creditError } = await supabaseAdmin.from("credits").insert({
      user_id: userId,
      credits_added: 0,
      credits_consumed: 0,
      remaining_balance: 0,
      reason: "account_created",
      reset_interval: "monthly",
    } as never);
    if (creditError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: creditError.message }, { status: 400 });
    }

    await supabaseAdmin.from("admin_logs").insert({
      admin_user_id: userId,
      target_user_id: userId,
      action: "USER_REGISTERED",
      payload: { email },
    });

    return NextResponse.json({ id: userId, email }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid registration data." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to register account." }, { status: 500 });
  }
}