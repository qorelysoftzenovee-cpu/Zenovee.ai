import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlanById } from "@/app/subscription-plans";
import { getCreditTopupById } from "@/app/credit-topups";
import { addTopupCredits, assignPlanCredits, computeNextRenewalDate } from "@/services/billing";
import { verifyCheckoutSignature } from "@/services/razorpay";
import { serverLog } from "@/lib/logger";

const verifyPayloadSchema = z
  .object({
    razorpay_payment_id: z.string().min(1),
    razorpay_subscription_id: z.string().min(1).optional(),
    razorpay_order_id: z.string().min(1).optional(),
    razorpay_signature: z.string().min(1),
  })
  .refine((value) => Boolean(value.razorpay_subscription_id || value.razorpay_order_id), {
    message: "Missing verification payload",
  });

async function wasPaymentAlreadyProcessed(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  razorpayPaymentId: string
) {
  const { data } = await supabaseAdmin
    .from("payments")
    .select("id,status")
    .eq("razorpay_transaction_id", razorpayPaymentId)
    .in("status", ["SUCCESS", "CREDIT_TOPUP"])
    .limit(1)
    .maybeSingle<{ id: string; status: string }>();

  return Boolean(data?.id);
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = verifyPayloadSchema.parse(await request.json());

    const verificationRef = body.razorpay_order_id ?? body.razorpay_subscription_id!;

    const valid = verifyCheckoutSignature({
      razorpay_order_id: verificationRef,
      razorpay_payment_id: body.razorpay_payment_id,
      razorpay_signature: body.razorpay_signature,
    });

    if (!valid) return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });

    const supabaseAdmin = getSupabaseAdmin();

    if (await wasPaymentAlreadyProcessed(supabaseAdmin, body.razorpay_payment_id)) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    if (body.razorpay_order_id) {
      const { data: pendingTopup } = await supabaseAdmin
        .from("payments")
        .select("id,plan,status,razorpay_transaction_id")
        .eq("user_id", user.id)
        .eq("order_id", body.razorpay_order_id)
        .maybeSingle<{ id: string; plan: string; status: string; razorpay_transaction_id: string | null }>();

      if (!pendingTopup) {
        return NextResponse.json({ error: "Topup payment not found" }, { status: 404 });
      }

      if (pendingTopup.status === "CREDIT_TOPUP" || pendingTopup.razorpay_transaction_id === body.razorpay_payment_id) {
        return NextResponse.json({ success: true, duplicate: true, mode: "topup" });
      }

      if (pendingTopup.status !== "PENDING") {
        return NextResponse.json({ error: "Topup payment is no longer pending." }, { status: 409 });
      }

      const topupId = pendingTopup.plan.replace("topup:", "");
      const topup = getCreditTopupById(topupId);
      if (!topup) {
        return NextResponse.json({ error: "Invalid topup" }, { status: 400 });
      }

      const nowIso = new Date().toISOString();
      const nextBalance = await addTopupCredits(user.id, topup.id, topup.credits, `topup:${body.razorpay_payment_id}`);

      await supabaseAdmin
        .from("payments")
        .update({ status: "CREDIT_TOPUP", razorpay_transaction_id: body.razorpay_payment_id, updated_at: nowIso } as never)
        .eq("id", pendingTopup.id)
        .eq("status", "PENDING");

      return NextResponse.json({ success: true, mode: "topup", creditsAdded: topup.credits, creditsAfter: nextBalance });
    }

    const subscriptionId = body.razorpay_subscription_id;
    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription id missing" }, { status: 400 });
    }

    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("plan_name")
      .eq("user_id", user.id)
      .eq("razorpay_subscription_id", subscriptionId)
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
      supabaseAdmin.from("payments").upsert(
        {
          user_id: user.id,
          payment_amount: Number((plan.amountInPaise / 100).toFixed(2)),
          plan: plan.id,
          currency: plan.currency,
          status: "SUCCESS",
          razorpay_transaction_id: body.razorpay_payment_id,
          subscription_id: subscriptionId,
          updated_at: nowIso,
        } as never,
        { onConflict: "razorpay_transaction_id" }
      ),
      assignPlanCredits(user.id, plan.id, `subscription:${body.razorpay_payment_id}`),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid verification payload" }, { status: 400 });
    }

    serverLog({
      level: "error",
      route: "api/billing/verify",
      message: "Billing verification failed",
      error,
    });
    return NextResponse.json({ error: "Billing verification failed" }, { status: 500 });
  }
}
