import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const userRole = (req.auth?.user as { role?: string } | undefined)?.role
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register")
  const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard")
  const isAdminPage = req.nextUrl.pathname.startsWith("/admin")

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL(userRole === "ADMIN" ? "/admin" : "/dashboard", req.nextUrl))
  }

  if (!isLoggedIn && isDashboardPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (!isLoggedIn && isAdminPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (isLoggedIn && isDashboardPage && userRole === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", req.nextUrl))
  }

  if (isLoggedIn && isAdminPage && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
}