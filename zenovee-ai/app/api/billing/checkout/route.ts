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

export async function POST(request: Request) {
  try {
    validateBillingEnv();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ipAddress = resolveClientIp(request);
    const rateLimit = checkRateLimit(`billing:checkout:${user.id}:${ipAddress}`, 8, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many checkout attempts. Retry in ${rateLimit.retryAfterSeconds}s.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const { planId } = checkoutRequestSchema.parse(await request.json());
    const normalizedPlanId = planId.toLowerCase();
    const plan = getPlanById(normalizedPlanId);

    if (!plan || !plan.active) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    const amountPaise = plan.amountPaise;
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      return NextResponse.json({ error: "Invalid plan amount." }, { status: 400 });
    }

    const idempotencyKey = resolveIdempotencyKey(request, user.id, plan.id);

    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("order_id, status")
      .eq("user_id", user.id)
      .eq("plan", plan.id)
      .eq("status", "PENDING")
      .maybeSingle<{ order_id: string | null; status: string | null }>();

    if (existingPayment?.order_id && existingPayment.status === "PENDING") {
      return NextResponse.json({
        success: true,
        checkout: {
          key: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          orderId: existingPayment.order_id,
          amountPaise,
          currency: "INR",
          plan: {
            id: plan.id,
            name: plan.name,
          },
        },
      });
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
        key: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
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
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid checkout request." }, { status: 400 });
    }

    serverLog({
      level: "error",
      route: "api/billing/checkout",
      message: "Checkout creation failed",
      error,
    });

    return NextResponse.json({ error: "Unable to initialize checkout right now." }, { status: 500 });
  }
}