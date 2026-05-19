import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/runtime";
import { serverLog } from "@/lib/logger";
import { normalizeRole } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isProtectedPage = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const isProtectedApi = pathname.startsWith("/api/tools") || pathname.startsWith("/api/billing") || pathname.startsWith("/api/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isExtensionApi = pathname.startsWith("/api/extension");

  if (!isSupabaseConfigured()) {
    if (isProtectedApi && !isExtensionApi) {
      return NextResponse.json({ success: false, error: "Authentication service is unavailable." }, { status: 503 });
    }

    if (isProtectedPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  }

  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  try {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && isProtectedApi && !isExtensionApi) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!user && isProtectedPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!user) {
      return response;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string | null }>();

    const role = normalizeRole(profile?.role);

    if (isAuthPage) {
      return NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/dashboard", request.url));
    }

    if (pathname.startsWith("/dashboard") && role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (isAdminApi && role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return response;
  } catch (error) {
    serverLog({
      level: "error",
      route: "proxy",
      message: "Middleware auth guard failed.",
      error,
    });

    if (isProtectedApi && !isExtensionApi) {
      return NextResponse.json({ success: false, error: "Unable to verify session." }, { status: 503 });
    }

    if (isProtectedPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  }
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/tools/:path*",
    "/api/billing/:path*",
    "/api/extension/:path*",
  ],
};
