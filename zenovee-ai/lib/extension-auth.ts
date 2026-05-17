import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type ExtensionAuthUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
};

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

export async function getExtensionUser(request: Request): Promise<ExtensionAuthUser | null> {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user?.id || !user.email) {
    return null;
  }

  const { data: profile } = await supabaseAdmin
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

export function getRequestIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  return forwardedFor.split(",")[0]?.trim() || "0.0.0.0";
}