import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { buildCheckoutPayload, getPlanById } from "@/lib/billing/plans";
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

type PaymentInsertPayload = Database["public"]["Tables"]["payments"]["Insert"];

function normalizePaymentAmount(amountPaise: number) {
  return Number((amountPaise / 100).toFixed(2));
}

function validateCheckoutPersistenceInput(input: {
  userId?: string | null;
  plan?: { id: string; credits: number; amountPaise: number } | null;
  amountPaise?: number | null;
  amountRupees?: number | null;
  order?: { id?: string | null; amount?: number | null; currency?: string | null } | null;
}) {
  if (!input.userId?.trim()) {
    return "Unable to continue checkout because the user record is missing.";
  }

  if (!input.plan?.id?.trim()) {
    return "Unable to continue checkout because the selected plan is invalid.";
  }

  if (!Number.isFinite(input.plan.credits) || input.plan.credits <= 0) {
    return "Unable to continue checkout because the selected plan credits are invalid.";
  }

  if (!Number.isFinite(input.amountPaise) || (input.amountPaise ?? 0) <= 0) {
    return "Unable to continue checkout because the selected plan amount is invalid.";
  }

  if (!Number.isFinite(input.amountRupees) || (input.amountRupees ?? 0) <= 0) {
    return "Unable to continue checkout because the normalized billing amount is invalid.";
  }

  if (!input.order?.id?.trim()) {
    return "Unable to continue checkout because the Razorpay order ID is missing.";
  }

  if (!Number.isFinite(input.order.amount) || (input.order.amount ?? 0) <= 0) {
    return "Unable to continue checkout because Razorpay returned an invalid order amount.";
  }

  if (input.order.amount !== input.amountPaise) {
    return "Unable to continue checkout because the Razorpay order amount does not match the selected plan.";
  }

  if ((input.order.currency ?? "").toUpperCase() !== "INR") {
    return "Unable to continue checkout because the Razorpay order currency is invalid.";
  }

  return null;
}

async function insertPaymentWithSchemaFallback(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  paymentInsert: PaymentInsertPayload,
  legacyPaymentInsert: PaymentInsertPayload & { amount: number }
) {
  const { error } = await supabaseAdmin.from("payments").insert(paymentInsert);

  if (!error) {
    return;
  }

  const shouldRetryWithLegacyAmount = /column\s+"?amount"?.*null|null value in column "amount"|amount/i.test(error.message);
  if (!shouldRetryWithLegacyAmount) {
    throw new Error(error.message);
  }

  serverLog({
    level: "warn",
    route: "api/billing/checkout",
    message: "Retrying payment insert with legacy amount column fallback",
    metadata: {
      paymentInsert,
      legacyPaymentInsert,
      supabaseError: error.message,
    },
  });

  const { error: legacyInsertError } = await supabaseAdmin.from("payments").insert(legacyPaymentInsert as never);
  if (legacyInsertError) {
    throw new Error(legacyInsertError.message);
  }
}

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
    const checkoutPlan = plan ? buildCheckoutPayload(plan.id) : null;
    const isScalePlan = normalizedPlanId === "scale";

    if (!plan || !plan.active || !checkoutPlan) {
      return jsonError("The selected plan is no longer available. Refresh the page and choose an active plan.", 404, { code: "PLAN_NOT_FOUND" });
    }

    const amountPaise = checkoutPlan.amountPaise;
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
            currency: checkoutPlan.currency,
            plan: {
              id: checkoutPlan.planId,
              name: checkoutPlan.displayName,
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

    if (isScalePlan) {
      serverLog({
        level: "info",
        route: "api/billing/checkout",
        message: "Scale checkout request diagnostics",
        metadata: {
          requestedPlanId: planId,
          normalizedPlanId,
          resolvedPlanId: plan.id,
          planName: checkoutPlan.displayName,
          credits: checkoutPlan.credits,
          monthlyPriceRupees: checkoutPlan.monthlyPriceRupees,
          amountPaise: checkoutPlan.amountPaise,
          idempotencyKey,
        },
      });
    }

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

    const amountRupees = normalizePaymentAmount(amountPaise);
    const persistenceValidationError = validateCheckoutPersistenceInput({
      userId: user.id,
      plan,
      amountPaise,
      amountRupees,
      order: {
        id: order.id,
        amount: typeof order.amount === "number" ? order.amount : null,
        currency: typeof order.currency === "string" ? order.currency : null,
      },
    });

    if (persistenceValidationError) {
      serverLog({
        level: "warn",
        route: "api/billing/checkout",
        message: "Checkout persistence validation failed",
        metadata: {
          userId: user.id,
          planId: plan.id,
          planCredits: plan.credits,
          amountPaise,
          amountRupees,
          orderId: order.id,
          orderAmount: order.amount,
          orderCurrency: order.currency,
        },
      });
      return jsonError(persistenceValidationError, 400, { code: "INVALID_PAYMENT_PERSISTENCE_INPUT" });
    }

    const nowIso = new Date().toISOString();
    const paymentInsert: PaymentInsertPayload = {
      user_id: user.id,
      payment_amount: amountRupees,
      plan: plan.id,
      currency: "INR",
      status: "PENDING",
      order_id: order.id,
    };

    const legacyPaymentInsert = {
      ...paymentInsert,
      amount: amountRupees,
    };

    serverLog({
      level: "info",
      route: "api/billing/checkout",
      message: "Payment insert payload prepared",
      metadata: {
        user_id: paymentInsert.user_id,
        plan: paymentInsert.plan,
        credits: plan.credits,
        amount: amountRupees,
        amountPaise,
        payment_amount: paymentInsert.payment_amount,
        currency: paymentInsert.currency,
        order_id: paymentInsert.order_id,
        status: paymentInsert.status,
      },
    });

    if (isScalePlan) {
      serverLog({
        level: "info",
        route: "api/billing/checkout",
        message: "Scale checkout persistence payload",
        metadata: {
          user_id: paymentInsert.user_id,
          plan: paymentInsert.plan,
          credits: plan.credits,
          amount: amountRupees,
          amountPaise,
          payment_amount: paymentInsert.payment_amount,
          currency: paymentInsert.currency,
          order_id: paymentInsert.order_id,
          status: paymentInsert.status,
        },
      });
    }

    await insertPaymentWithSchemaFallback(supabaseAdmin, paymentInsert, legacyPaymentInsert);

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
        currency: checkoutPlan.currency,
        plan: {
          id: checkoutPlan.planId,
          name: checkoutPlan.displayName,
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