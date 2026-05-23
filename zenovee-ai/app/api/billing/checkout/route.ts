import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getPlanById } from "@/app/subscription-plans";
import { getCreditTopupById } from "@/app/credit-topups";
import { env, validateBillingEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getRazorpayClient } from "@/services/razorpay";
import { getOrCreateRazorpayPlanId } from "@/services/billing";
import { serverLog } from "@/lib/logger";
import { checkRateLimit, resolveClientIp } from "@/lib/rate-limit";

const checkoutRequestSchema = z
  .object({
    planId: z.string().min(1).optional(),
    topupId: z.string().min(1).optional(),
  })
  .refine((value) => Number(Boolean(value.planId)) + Number(Boolean(value.topupId)) === 1, {
    message: "Provide exactly one checkout target.",
  });

const IDEMPOTENCY_HEADER = "x-idempotency-key";

export async function POST(request: Request) {
  try {
    validateBillingEnv();

    const hasSupabaseConfig = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

    if (!hasSupabaseConfig) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }

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

    const { planId, topupId } = checkoutRequestSchema.parse(await request.json());
    const requestKey = request.headers.get(IDEMPOTENCY_HEADER)?.trim() || null;

    if (topupId) {
      const topup = getCreditTopupById(topupId);
      if (!topup) {
        return NextResponse.json({ error: "Topup not found." }, { status: 404 });
      }

      const razorpay = getRazorpayClient();
      const supabaseAdmin = getSupabaseAdmin();

      if (requestKey) {
        const { data: existingPayment } = await supabaseAdmin
          .from("payments")
          .select("order_id,status")
          .eq("user_id", user.id)
          .eq("plan", `topup:${topup.id}`)
          .eq("invoice_id", `idemp:${requestKey}`)
          .maybeSingle<{ order_id: string | null; status: string }>();

        if (existingPayment?.order_id) {
          return NextResponse.json({
            success: true,
            duplicate: true,
            mode: "topup",
            order: {
              id: existingPayment.order_id,
              amount: topup.amountInPaise,
              currency: "INR",
            },
            razorpayKey: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            topup,
          });
        }
      }

      const order = await razorpay.orders.create({
        amount: topup.amountInPaise,
        currency: "INR",
        receipt: `topup_${user.id}_${Date.now()}`,
        notes: {
          userId: user.id,
          topupId: topup.id,
          credits: String(topup.credits),
          app: "zenovee",
        },
      });

      const { error: paymentError } = await supabaseAdmin.from("payments").insert({
        user_id: user.id,
        payment_amount: Number((topup.amountInPaise / 100).toFixed(2)),
        plan: `topup:${topup.id}`,
        currency: "INR",
        status: "PENDING",
        order_id: order.id,
        invoice_id: requestKey ? `idemp:${requestKey}` : null,
      });

      if (paymentError) {
        throw new Error(paymentError.message);
      }

      return NextResponse.json({
        success: true,
        mode: "topup",
        order: {
          id: order.id,
          amount: topup.amountInPaise,
          currency: "INR",
        },
        razorpayKey: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        topup,
      });
    }

    const plan = planId ? getPlanById(planId) : undefined;

    if (!plan) {
      return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    }

    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
    }

    const razorpay = getRazorpayClient();
    const supabaseAdmin = getSupabaseAdmin();

    if (requestKey) {
      const { data: existingSubscriptionPayment } = await supabaseAdmin
        .from("payments")
        .select("subscription_id,status")
        .eq("user_id", user.id)
        .eq("plan", plan.id)
        .eq("invoice_id", `idemp:${requestKey}`)
        .maybeSingle<{ subscription_id: string | null; status: string }>();

      if (existingSubscriptionPayment?.subscription_id) {
        return NextResponse.json({
          success: true,
          duplicate: true,
          subscription: {
            id: existingSubscriptionPayment.subscription_id,
            status: existingSubscriptionPayment.status,
          },
          razorpayKey: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          plan: { id: plan.id, name: plan.name, amountInPaise: plan.amountInPaise, currency: plan.currency },
        });
      }
    }

    const razorpayPlanId = await getOrCreateRazorpayPlanId(plan.id);

    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: {
        userId: user.id,
        planId: plan.id,
        app: "zenovee",
      },
    });

    const { error: paymentError } = await supabaseAdmin.from("payments").insert({
      user_id: user.id,
      payment_amount: Number((plan.amountInPaise / 100).toFixed(2)),
      plan: plan.id,
      currency: plan.currency,
      status: "PENDING",
      subscription_id: subscription.id,
      invoice_id: requestKey ? `idemp:${requestKey}` : null,
    });

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    const { error: subscriptionError } = await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan_name: plan.id,
        status: "PENDING",
        billing_cycle: "monthly",
        renewal_date: null,
        current_period_end: null,
        razorpay_subscription_id: subscription.id,
      },
      { onConflict: "user_id" }
    );

    if (subscriptionError) {
      throw new Error(subscriptionError.message);
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
      },
      razorpayKey: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      plan: { id: plan.id, name: plan.name, amountInPaise: plan.amountInPaise, currency: plan.currency },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid checkout request." }, { status: 400 });
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown checkout error";
    serverLog({
      level: "error",
      route: "api/billing/checkout",
      message: "Failed to initialize billing checkout.",
      error,
    });

    return NextResponse.json(
      {
        error: "Unable to initialize checkout right now.",
        reason: errorMessage,
        source: "api/billing/checkout",
      },
      { status: 500 }
    );
  }
}