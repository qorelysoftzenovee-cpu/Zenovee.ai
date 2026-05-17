import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/runtime";
import { serverLog } from "@/lib/logger";

const ADMIN_AUTH_COOKIE = "zenovee_admin_verified";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  const isProtectedPage = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const isProtectedApi = pathname.startsWith("/api/tools") || pathname.startsWith("/api/billing") || pathname.startsWith("/api/admin");
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

    if (user && pathname.startsWith("/admin")) {
      if (pathname !== "/admin/verify") {
        const isAdminVerified = request.cookies.get(ADMIN_AUTH_COOKIE)?.value === "1";
        if (!isAdminVerified) {
          return NextResponse.redirect(new URL("/admin/verify", request.url));
        }
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle<{ role: "USER" | "ADMIN" }>();

      if (profile?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
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
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/tools/:path*",
    "/api/billing/:path*",
    "/api/extension/:path*",
  ],
};
