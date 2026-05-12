import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type AuthUser = {
  id: string;
  email: string;
  role: Database["public"]["Tables"]["users"]["Row"]["role"];
};

export async function getCurrentUser(): Promise<AuthUser | null> {
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
    .maybeSingle<{ id: string; email: string; role: "USER" | "ADMIN" }>();

  return {
    id: user.id,
    email: user.email,
    role: profile?.role ?? "USER",
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}
