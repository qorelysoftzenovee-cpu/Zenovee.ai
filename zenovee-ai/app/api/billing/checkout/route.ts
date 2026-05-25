import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getPlanById } from "@/lib/billing/plans";
import { env, validateBillingEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getRazorpayClient } from "@/lib/razorpay/client";
import { serverLog } from "@/lib/logger";
import { checkRateLimit, resolveClientIp } from "@/lib/rate-limit";
import type { Database } from "@/lib/supabase/types";

const checkoutRequestSchema = z.object({
  planId: z.string().min(1),
});

const REUSABLE_PENDING_WINDOW_MS = 15 * 60 * 1000;

function resolveCheckoutKey() {
  const publicKey = env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ?? "";
  const serverKey = env.RAZORPAY_KEY_ID?.trim() ?? "";

  return publicKey || serverKey;
}

function resolveIdempotencyKey(request: Request, userId: string, planId: string) {
  const rawKey = request.headers.get("x-idempotency-key")?.trim();
  if (rawKey && rawKey.length >= 8 && rawKey.length <= 128) {
    return `${userId}:${rawKey}`;
  }

  return `${userId}:plan:${planId}`;
}

function buildSafeReceipt(planId: string, userId: string) {
  const compactUserId = userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) || "user";
  const compactPlanId = planId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) || "plan";
  const suffix = Date.now().toString(36);
  // Razorpay receipt supports a short identifier (commonly <= 40 chars).
  return `pl${compactPlanId}_u${compactUserId}_${suffix}`.slice(0, 40);
}

function jsonError(message: string, status: number, options?: { code?: string; retryable?: boolean; retryAfterSeconds?: number }) {
  const headers = options?.retryAfterSeconds ? { "Retry-After": String(options.retryAfterSeconds) } : undefined;
  return NextResponse.json(
    {
      error: message,
      code: options?.code,
      retryable: options?.retryable ?? false,
      retryAfterSeconds: options?.retryAfterSeconds,
    },
    { status, headers }
  );
}

export async function POST(request: Request) {
  try {
    validateBillingEnv();

    const user = await getCurrentUser();
    if (!user) {
      return jsonError("Please sign in again to continue with checkout.", 401, { code: "AUTH_REQUIRED" });
    }

    const checkoutKey = resolveCheckoutKey();
    if (!checkoutKey) {
      return jsonError("Payments are temporarily unavailable because the checkout key is missing. Please contact support or retry shortly.", 503, {
        code: "CHECKOUT_KEY_MISSING",
        retryable: true,
      });
    }

    const ipAddress = resolveClientIp(request);
    const rateLimit = checkRateLimit(`billing:checkout:${user.id}:${ipAddress}`, 8, 60_000);
    if (!rateLimit.allowed) {
      return jsonError(`You’ve tried checkout too many times in a short period. Please retry in ${rateLimit.retryAfterSeconds}s.`, 429, {
        code: "RATE_LIMITED",
        retryable: true,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }

    const { planId } = checkoutRequestSchema.parse(await request.json());
    const normalizedPlanId = planId.trim().toLowerCase();
    const plan = getPlanById(normalizedPlanId);

    if (!plan || !plan.active) {
      return jsonError("The selected plan is no longer available. Refresh the page and choose an active plan.", 404, { code: "PLAN_NOT_FOUND" });
    }

    const amountPaise = plan.amountPaise;
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      return jsonError("The selected plan has an invalid billing amount. Please refresh and try again.", 400, { code: "INVALID_PLAN_AMOUNT" });
    }

    const idempotencyKey = resolveIdempotencyKey(request, user.id, plan.id);

    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingPayments, error: pendingLookupError } = await supabaseAdmin
      .from("payments")
      .select("id, order_id, status, created_at")
      .eq("user_id", user.id)
      .eq("plan", plan.id)
      .eq("status", "PENDING")
      .order("created_at", { ascending: false })
      .limit(5);

    if (pendingLookupError) {
      throw new Error(pendingLookupError.message);
    }

    const existingPayment = (existingPayments ?? []).find((payment) => Boolean(payment.order_id));

    if (existingPayment?.order_id) {
      const createdAt = existingPayment.created_at ? new Date(existingPayment.created_at).getTime() : 0;
      const isReusable = createdAt > 0 && Date.now() - createdAt < REUSABLE_PENDING_WINDOW_MS;

      if (isReusable) {
        return NextResponse.json({
          success: true,
          checkout: {
            key: checkoutKey,
            orderId: existingPayment.order_id,
            amountPaise,
            currency: "INR",
            plan: {
              id: plan.id,
              name: plan.name,
            },
            resumed: true,
          },
        });
      }

      await supabaseAdmin
        .from("payments")
        .update({ status: "CANCELLED", failure_reason: "CHECKOUT_EXPIRED", updated_at: new Date().toISOString() } as never)
        .eq("id", existingPayment.id)
        .eq("status", "PENDING");
    }

    const razorpay = getRazorpayClient();

    serverLog({
      level: "info",
      route: "api/billing/checkout",
      message: "Checkout request validated",
      metadata: { userId: user.id, planId: plan.id, amountPaise, idempotencyKey },
    });

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: buildSafeReceipt(plan.id, user.id),
      notes: {
        userId: user.id,
        planId: plan.id,
      },
    });

    serverLog({
      level: "info",
      route: "api/billing/checkout",
      message: "Razorpay order created",
      metadata: { userId: user.id, planId: plan.id, amountPaise, order },
    });

    const nowIso = new Date().toISOString();
    const paymentInsert: Database["public"]["Tables"]["payments"]["Insert"] = {
      user_id: user.id,
      payment_amount: Number((amountPaise / 100).toFixed(2)),
      plan: plan.id,
      currency: "INR",
      status: "PENDING",
      order_id: order.id,
    };

    const { error: paymentError } = await supabaseAdmin.from("payments").insert(paymentInsert);
    if (paymentError) {
      throw new Error(paymentError.message);
    }

    const { error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan_name: plan.id,
          status: "PENDING",
          billing_cycle: "monthly",
          cancel_at_period_end: false,
          updated_at: nowIso,
        } as never,
        { onConflict: "user_id" }
      );

    if (subscriptionError) {
      throw new Error(subscriptionError.message);
    }

    return NextResponse.json({
      success: true,
      checkout: {
        key: checkoutKey,
        orderId: order.id,
        amountPaise,
        currency: "INR",
        plan: {
          id: plan.id,
          name: plan.name,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Please choose a valid plan before starting checkout.", 400, { code: "INVALID_CHECKOUT_REQUEST" });
    }
    // Provide more actionable errors for common failure modes so the client
    // surface is clearer and we can avoid the generic message in many cases.
    const msg = error instanceof Error ? error.message : String(error);

    // Config / missing secret errors
    if (msg.includes("Invalid billing environment configuration") || msg.includes("Razorpay is not configured")) {
      serverLog({ level: "error", route: "api/billing/checkout", message: "Billing configuration error", error });
      return jsonError("Payments are temporarily unavailable because billing is not configured. Please contact support or try again later.", 503, {
        code: "CHECKOUT_CONFIG_ERROR",
        retryable: false,
      });
    }

    // Transient external errors (Razorpay / network / Supabase). Mark retryable.
    if (msg.includes("ECONNREFUSED") || msg.includes("timeout") || msg.includes("Failed to fetch") || msg.includes("Razorpay")) {
      serverLog({ level: "error", route: "api/billing/checkout", message: "External service error during checkout", error });
      return jsonError("We couldn’t start secure checkout right now due to a temporary service issue. Please retry in a moment.", 502, {
        code: "CHECKOUT_EXTERNAL_ERROR",
        retryable: true,
        retryAfterSeconds: 10,
      });
    }

    // Fallback: log and return a generic retryable error
    serverLog({ level: "error", route: "api/billing/checkout", message: "Checkout creation failed", error });

    return jsonError("We couldn’t start secure checkout right now. Please retry in a moment. If this keeps happening, refresh the page and try again.", 500, {
      code: "CHECKOUT_INITIALIZATION_FAILED",
      retryable: true,
    });
  }
}