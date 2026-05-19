import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { serverLog } from "@/lib/logger";
import { env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type AppRole = "admin" | "user";

export function normalizeRole(role: string | null | undefined): AppRole {
  return String(role ?? "").toLowerCase() === "admin" ? "admin" : "user";
}

export type AuthUser = {
  id: string;
  email: string;
  role: AppRole;
};

async function syncConfiguredAdminRole(user: {
  id: string;
  email: string;
  role: AppRole;
}) {
  const configuredAdminEmail = env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!configuredAdminEmail || user.role === "admin" || user.email.toLowerCase() !== configuredAdminEmail) {
    return user.role;
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("users")
      .update({ role: "admin", updated_at: new Date().toISOString() } as never)
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    return "admin" satisfies AppRole;
  } catch (error) {
    serverLog({
      level: "error",
      route: "lib/auth:syncConfiguredAdminRole",
      message: "Failed to synchronize configured admin role.",
      error,
    });

    return user.role;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || !user.email) {
      return null;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id,email,role")
      .eq("id", user.id)
      .maybeSingle<{ id: string; email: string; role: Database["public"]["Tables"]["users"]["Row"]["role"] | "ADMIN" | "USER" }>();

    const resolvedUser = {
      id: user.id,
      email: user.email.toLowerCase(),
      role: normalizeRole(profile?.role),
    } satisfies AuthUser;

    return {
      ...resolvedUser,
      role: await syncConfiguredAdminRole(resolvedUser),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("Dynamic server usage")) {
      return null;
    }

    serverLog({
      level: "error",
      route: "lib/auth:getCurrentUser",
      message: "Failed to resolve current user.",
      error,
    });
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireStandardUser() {
  const user = await requireUser();
  if (user.role === "admin") {
    redirect("/admin");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}

export async function requireAdminApi() {
  const user = await getCurrentUser();

  if (!user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }

  if (user.role !== "admin") {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }

  return { user } as const;
}
