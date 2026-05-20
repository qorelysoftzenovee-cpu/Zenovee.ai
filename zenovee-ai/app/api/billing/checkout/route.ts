import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPlanById } from "@/app/subscription-plans";
import { getCreditTopupById } from "@/app/credit-topups";
import { env, validateBillingEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getRazorpayClient } from "@/services/razorpay";
import { getOrCreateRazorpayPlanId } from "@/services/billing";

export async function POST(request: Request) {
  validateBillingEnv();

  const hasSupabaseConfig = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

  if (!hasSupabaseConfig) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId, topupId } = (await request.json()) as { planId?: string; topupId?: string };

  if (topupId) {
    const topup = getCreditTopupById(topupId);
    if (!topup) {
      return NextResponse.json({ error: "Topup not found." }, { status: 404 });
    }

    const razorpay = getRazorpayClient();
    const supabaseAdmin = getSupabaseAdmin();

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

    await supabaseAdmin.from("payments").insert({
      user_id: user.id,
      payment_amount: Number((topup.amountInPaise / 100).toFixed(2)),
      plan: `topup:${topup.id}`,
      currency: "INR",
      status: "PENDING",
      order_id: order.id,
    });

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

  await supabaseAdmin.from("payments").insert({
    user_id: user.id,
    payment_amount: Number((plan.amountInPaise / 100).toFixed(2)),
    plan: plan.id,
    currency: plan.currency,
    status: "PENDING",
    subscription_id: subscription.id,
  });

  await supabaseAdmin.from("subscriptions").upsert(
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

  return NextResponse.json({
    success: true,
    subscription: {
      id: subscription.id,
      status: subscription.status,
    },
    razorpayKey: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    plan: { id: plan.id, name: plan.name, amountInPaise: plan.amountInPaise, currency: plan.currency },
  });
}