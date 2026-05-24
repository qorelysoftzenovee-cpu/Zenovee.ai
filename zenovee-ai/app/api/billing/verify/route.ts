import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlanById } from "@/lib/billing/plans";
import { assignPlanCredits, computeNextRenewalDate } from "@/lib/billing/service";
import { getRazorpayClient, verifyCheckoutSignature } from "@/lib/razorpay/client";
import { serverLog } from "@/lib/logger";
import { checkRateLimit, resolveClientIp } from "@/lib/rate-limit";

const verifyPayloadSchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ipAddress = resolveClientIp(request);
    const rateLimit = checkRateLimit(`billing:verify:${user.id}:${ipAddress}`, 12, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many verification attempts. Retry in ${rateLimit.retryAfterSeconds}s.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const body = verifyPayloadSchema.parse(await request.json());

    const valid = verifyCheckoutSignature({
      razorpay_order_id: body.razorpay_order_id,
      razorpay_payment_id: body.razorpay_payment_id,
      razorpay_signature: body.razorpay_signature,
    });

    serverLog({
      level: "info",
      route: "api/billing/verify",
      message: "Razorpay verification result",
      metadata: {
        userId: user.id,
        razorpay_order_id: body.razorpay_order_id,
        razorpay_payment_id: body.razorpay_payment_id,
        verification_valid: valid,
      },
    });

    if (!valid) {
      await getSupabaseAdmin()
        .from("payments")
        .update({ status: "FAILED", failure_reason: "INVALID_SIGNATURE", updated_at: new Date().toISOString() } as never)
        .eq("user_id", user.id)
        .eq("order_id", body.razorpay_order_id)
        .eq("status", "PENDING");
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const razorpay = getRazorpayClient();
    const supabaseAdmin = getSupabaseAdmin();

    const payment = await razorpay.payments.fetch(body.razorpay_payment_id);
    if (!payment || payment.order_id !== body.razorpay_order_id || payment.status !== "captured") {
      await supabaseAdmin
        .from("payments")
        .update({ status: "FAILED", failure_reason: "AUTHENTICITY_CHECK_FAILED", updated_at: new Date().toISOString() } as never)
        .eq("user_id", user.id)
        .eq("order_id", body.razorpay_order_id)
        .eq("status", "PENDING");
      return NextResponse.json({ error: "Payment authenticity check failed" }, { status: 400 });
    }

    const { data: pendingPayment } = await supabaseAdmin
      .from("payments")
      .select("id,plan,status")
      .eq("user_id", user.id)
      .eq("order_id", body.razorpay_order_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; plan: string; status: string }>();

    if (!pendingPayment) {
      return NextResponse.json({ error: "Pending payment not found" }, { status: 404 });
    }

    if (pendingPayment.status === "SUCCESS") {
      return NextResponse.json({ success: true, duplicate: true });
    }

    if (pendingPayment.status !== "PENDING") {
      return NextResponse.json({ error: "Payment is no longer pending." }, { status: 409 });
    }

    const plan = getPlanById(pendingPayment.plan);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan on payment record" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const nextRenewal = computeNextRenewalDate();

    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .update({
        status: "SUCCESS",
        razorpay_transaction_id: body.razorpay_payment_id,
        updated_at: nowIso,
      } as never)
      .eq("id", pendingPayment.id)
      .eq("status", "PENDING");

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    const { error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "active",
        plan_name: plan.id,
        renewal_date: nextRenewal,
        current_period_end: nextRenewal,
        next_renewal_at: nextRenewal,
        last_payment_at: nowIso,
        grace_until: null,
        cancel_at_period_end: false,
        updated_at: nowIso,
      } as never)
      .eq("user_id", user.id);

    if (subscriptionError) {
      throw new Error(subscriptionError.message);
    }

    await assignPlanCredits(user.id, plan.id, `subscription:${body.razorpay_payment_id}`);

    serverLog({
      level: "info",
      route: "api/billing/verify",
      message: "Subscription activation result",
      metadata: {
        userId: user.id,
        planId: plan.id,
        amountPaise: plan.amountPaise,
        paymentId: body.razorpay_payment_id,
        orderId: body.razorpay_order_id,
      },
    });

    return NextResponse.json({
      success: true,
      billing: {
        subscription: {
          planId: plan.id,
          status: "active",
          renewalAt: nextRenewal,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid verification payload" }, { status: 400 });
    }

    serverLog({ level: "error", route: "api/billing/verify", message: "Billing verification failed", error });
    return NextResponse.json({ error: "Billing verification failed" }, { status: 500 });
  }
}