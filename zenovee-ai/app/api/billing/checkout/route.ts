import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPlanById } from "@/app/subscription-plans";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getRazorpayClient } from "@/services/razorpay";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId } = (await request.json()) as { planId?: string };
  const plan = planId ? getPlanById(planId) : undefined;

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  const razorpay = getRazorpayClient();

  const order = await razorpay.orders.create({
    amount: Math.round(plan.price * 100),
    currency: "INR",
    receipt: `sub_${user.id}_${plan.id}_${Date.now()}`,
    notes: {
      userId: user.id,
      planId: plan.id,
    },
  });

  await supabaseAdmin.from("payments").insert({
    user_id: user.id,
    amount: plan.price,
    currency: "INR",
    status: "PENDING",
    order_id: order.id,
  });

  await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: user.id,
      plan_id: plan.id,
      status: "PENDING",
      current_period_end: null,
    },
    { onConflict: "user_id" }
  );

  return NextResponse.json({
    success: true,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    },
  });
}