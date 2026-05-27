import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthCallbackPageProps = {
  searchParams: Promise<{
    code?: string;
    next?: string;
    mode?: string;
  }>;
};

function resolveSafeRedirect(next?: string, mode?: string) {
  if (mode === "recovery") {
    return "/settings?mode=recovery";
  }

  if (!next) {
    return null;
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return null;
  }

  return next;
}

export default async function AuthCallbackPage({ searchParams }: AuthCallbackPageProps) {
  const { code, next, mode } = await searchParams;

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const safeRedirect = resolveSafeRedirect(next, mode);
  if (safeRedirect) {
    redirect(safeRedirect);
  }

  redirect(user.role === "admin" ? "/admin" : "/dashboard");
}