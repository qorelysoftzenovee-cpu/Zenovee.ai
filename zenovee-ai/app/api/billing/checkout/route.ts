import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPlanById } from "@/app/subscription-plans";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

  const orderId = `local_${user.id}_${plan.id}_${Date.now()}`;

  await supabaseAdmin.from("payments").insert({
    user_id: user.id,
    amount: plan.price,
    currency: "INR",
    status: "PENDING",
    order_id: orderId,
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
    mode: env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET ? "configured" : "pending_configuration",
    message:
      env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
        ? "Checkout request recorded. Connect the Razorpay frontend modal to complete payment."
        : "Razorpay keys are not configured yet. Billing request was recorded for operational visibility.",
  });
}