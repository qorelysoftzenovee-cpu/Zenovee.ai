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
      return NextResponse.json({ error: "Unable to create your account right now." }, { status: 400 });
    }

    const userId = createdAuth.user.id;

    const profilePayload: Record<string, unknown> = {
      id: userId,
      email,
      name: payload.name.trim(),
      role: "user",
      status: "ACTIVE",
      plan: "starter",
      signup_date: new Date().toISOString(),
    };

    let profileError: { message: string } | null = null;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const { error } = await supabaseAdmin.from("users").insert(profilePayload as never);
      if (!error) {
        profileError = null;
        break;
      }

      const missingColumnMatch = error.message.match(/Could not find the '([^']+)' column of 'users' in the schema cache/i);
      if (missingColumnMatch?.[1]) {
        delete profilePayload[missingColumnMatch[1]];
        continue;
      }

      profileError = { message: error.message };
      break;
    }

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      if (profileError.message.includes("Could not find the table 'public.users'")) {
        return NextResponse.json(
          { error: "Database is not initialized. Run supabase/bootstrap.sql in Supabase SQL Editor." },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: "Unable to prepare your account profile right now." }, { status: 400 });
    }

    const creditsPayload: Record<string, unknown> = {
      user_id: userId,
      total_credits: 0,
      used_credits: 0,
      available_credits: 0,
      updated_at: new Date().toISOString(),
    };

    let creditError: { message: string } | null = null;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const { error } = await supabaseAdmin.from("user_credits").upsert(creditsPayload as never, { onConflict: "user_id" });
      if (!error) {
        creditError = null;
        break;
      }

      const missingColumnMatch = error.message.match(/Could not find the '([^']+)' column of 'user_credits' in the schema cache/i);
      if (missingColumnMatch?.[1]) {
        delete creditsPayload[missingColumnMatch[1]];
        continue;
      }

      creditError = { message: error.message };
      break;
    }

    if (creditError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Unable to prepare your account credits right now." }, { status: 400 });
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