import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlanById } from "@/app/subscription-plans";
import { getCreditTopupById } from "@/app/credit-topups";
import { addTopupCredits, assignPlanCredits, computeNextRenewalDate } from "@/services/billing";
import { verifyCheckoutSignature } from "@/services/razorpay";
import { serverLog } from "@/lib/logger";
import { checkRateLimit, resolveClientIp } from "@/lib/rate-limit";

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

async function markPendingPaymentAsProcessed(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  paymentId: string,
  updates: Record<string, unknown>
) {
  const { error } = await supabaseAdmin
    .from("payments")
    .update(updates as never)
    .eq("id", paymentId)
    .eq("status", "PENDING");

  if (error) {
    throw new Error(error.message);
  }
}

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
      razorpay_subscription_id: body.razorpay_subscription_id,
      razorpay_payment_id: body.razorpay_payment_id,
      razorpay_signature: body.razorpay_signature,
    });

    serverLog({
      level: "info",
      route: "api/billing/verify",
      message: "Razorpay verification payload audit",
      metadata: {
        userId: user.id,
        razorpay_order_id: body.razorpay_order_id ?? null,
        razorpay_subscription_id: body.razorpay_subscription_id ?? null,
        razorpay_payment_id: body.razorpay_payment_id,
        signature_length: body.razorpay_signature.length,
        verification_valid: valid,
      },
    });

    if (!valid) {
      return NextResponse.json(
        {
          error: "Invalid payment signature",
          reason: "Razorpay signature mismatch. Confirm live key secret and payload pairing.",
          source: "api/billing/verify",
        },
        { status: 400 }
      );
    }

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

      await markPendingPaymentAsProcessed(supabaseAdmin, pendingTopup.id, {
        status: "CREDIT_TOPUP",
        razorpay_transaction_id: body.razorpay_payment_id,
        updated_at: nowIso,
      });

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

    const [{ data: pendingSubscriptionPayment }] = await Promise.all([
      supabaseAdmin
        .from("payments")
        .select("id,status")
        .eq("user_id", user.id)
        .eq("subscription_id", subscriptionId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string; status: string }>(),
    ]);

    const subscriptionUpdate = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "ACTIVE",
        renewal_date: nextRenewal,
        current_period_end: nextRenewal,
        next_renewal_at: nextRenewal,
        last_payment_at: nowIso,
        grace_until: null,
        cancel_at_period_end: false,
        updated_at: nowIso,
      } as never)
      .eq("user_id", user.id);

    if (subscriptionUpdate.error) {
      throw new Error(`Subscription activation failed: ${subscriptionUpdate.error.message}`);
    }

    await Promise.all([
      pendingSubscriptionPayment?.id
        ? markPendingPaymentAsProcessed(supabaseAdmin, pendingSubscriptionPayment.id, {
            status: "SUCCESS",
            razorpay_transaction_id: body.razorpay_payment_id,
            updated_at: nowIso,
          })
        : supabaseAdmin.from("payments").upsert(
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

    serverLog({
      level: "info",
      route: "api/billing/verify",
      message: "Subscription verification success",
      metadata: {
        userId: user.id,
        subscriptionId,
        planId: plan.id,
        razorpay_payment_id: body.razorpay_payment_id,
      },
    });

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
