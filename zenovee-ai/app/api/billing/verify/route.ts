import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlanById } from "@/app/subscription-plans";
import { assignPlanCredits, computeNextRenewalDate } from "@/services/billing";
import { verifyCheckoutSignature } from "@/services/razorpay";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    razorpay_payment_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature?: string;
  };

  if (!body.razorpay_payment_id || !body.razorpay_subscription_id || !body.razorpay_signature) {
    return NextResponse.json({ error: "Missing verification payload" }, { status: 400 });
  }

  const valid = verifyCheckoutSignature({
    razorpay_order_id: body.razorpay_subscription_id,
    razorpay_payment_id: body.razorpay_payment_id,
    razorpay_signature: body.razorpay_signature,
  });

  if (!valid) return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });

  const supabaseAdmin = getSupabaseAdmin();
  const { data: subscription } = await supabaseAdmin
    .from("subscriptions")
    .select("plan_name")
    .eq("user_id", user.id)
    .eq("razorpay_subscription_id", body.razorpay_subscription_id)
    .maybeSingle<{ plan_name: string }>();

  if (!subscription) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  const plan = getPlanById(subscription.plan_name);
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const nowIso = new Date().toISOString();
  const nextRenewal = computeNextRenewalDate();

  await Promise.all([
    supabaseAdmin
      .from("subscriptions")
      .update({
        status: "ACTIVE",
        renewal_date: nextRenewal,
        current_period_end: nextRenewal,
        next_renewal_at: nextRenewal,
        last_payment_at: nowIso,
        grace_until: null,
        updated_at: nowIso,
      } as never)
      .eq("user_id", user.id),
    supabaseAdmin.from("payments").insert({
      user_id: user.id,
      payment_amount: plan.price,
      plan: plan.id,
      currency: plan.currency,
      status: "SUCCESS",
      razorpay_transaction_id: body.razorpay_payment_id,
      subscription_id: body.razorpay_subscription_id,
    }),
    assignPlanCredits(user.id, plan.id),
  ]);

  return NextResponse.json({ success: true });
}
