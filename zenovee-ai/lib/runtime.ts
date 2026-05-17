import { NextResponse } from "next/server";
import { serverLog } from "@/lib/logger";

export function missingConfigMessage(service: string) {
  return `${service} is not configured. Please contact the site administrator.`;
}

export function getPublicEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
  };
}

export function getServerEnv() {
  return {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "",
    groqApiKey: process.env.GROQ_API_KEY?.trim() ?? "",
    razorpayKeyId: process.env.RAZORPAY_KEY_ID?.trim() ?? "",
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET?.trim() ?? "",
    razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "",
    adminPanelPassword: process.env.ADMIN_PANEL_PASSWORD?.trim() ?? "",
  };
}

export function isSupabaseConfigured() {
  const publicEnv = getPublicEnv();
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}

export function isSupabaseAdminConfigured() {
  const publicEnv = getPublicEnv();
  const serverEnv = getServerEnv();
  return Boolean(publicEnv.supabaseUrl && serverEnv.supabaseServiceRoleKey);
}

export function isRazorpayConfigured() {
  const serverEnv = getServerEnv();
  return Boolean(serverEnv.razorpayKeyId && serverEnv.razorpayKeySecret);
}

export function safeErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function jsonApiError(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function withApiErrorHandling(
  route: string,
  handler: () => Promise<NextResponse>,
  fallback = "Unable to process this request right now.",
) {
  try {
    return await handler();
  } catch (error) {
    serverLog({
      level: "error",
      route,
      message: safeErrorMessage(error, fallback),
      error,
    });

    return jsonApiError(fallback, 500);
  }
}
