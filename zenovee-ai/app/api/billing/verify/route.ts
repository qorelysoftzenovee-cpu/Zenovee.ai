import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildActivationPayload, getPlanById } from "@/lib/billing/plans";
import { assignPlanCredits, computeNextRenewalDate } from "@/lib/billing/service";
import { getRazorpayClient, verifyCheckoutSignature } from "@/lib/razorpay/client";
import { serverLog } from "@/lib/logger";
import { checkRateLimit, resolveClientIp } from "@/lib/rate-limit";

const verifyPayloadSchema = z.object({
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

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
    const user = await getCurrentUser();
    if (!user) return jsonError("Your session expired before payment verification completed. Please sign in again and verify the payment status from billing.", 401, { code: "AUTH_REQUIRED" });

    const ipAddress = resolveClientIp(request);
    const rateLimit = checkRateLimit(`billing:verify:${user.id}:${ipAddress}`, 12, 60_000);
    if (!rateLimit.allowed) {
      return jsonError(`Payment verification is temporarily rate limited. Please retry in ${rateLimit.retryAfterSeconds}s.`, 429, {
        code: "RATE_LIMITED",
        retryable: true,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }

    const body = verifyPayloadSchema.parse(await request.json());

    serverLog({
      level: "info",
      route: "api/billing/verify",
      message: "Payment verification started",
      metadata: {
        userId: user.id,
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
      },
    });

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
      return jsonError("Payment validation failed because the secure signature did not match. Please retry the payment from billing.", 400, { code: "INVALID_SIGNATURE" });
    }

    const razorpay = getRazorpayClient();
    const supabaseAdmin = getSupabaseAdmin();

    const payment = await razorpay.payments.fetch(body.razorpay_payment_id);
    const razorpaySubscriptionId = typeof payment?.subscription_id === "string" ? payment.subscription_id : null;
    serverLog({
      level: "info",
      route: "api/billing/verify",
      message: "Razorpay payment fetched for verification",
      metadata: {
        userId: user.id,
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
        razorpayStatus: payment?.status,
        razorpaySubscriptionId,
      },
    });

    if (!payment || payment.order_id !== body.razorpay_order_id || payment.status !== "captured") {
      await supabaseAdmin
        .from("payments")
        .update({ status: "FAILED", failure_reason: "AUTHENTICITY_CHECK_FAILED", updated_at: new Date().toISOString() } as never)
        .eq("user_id", user.id)
        .eq("order_id", body.razorpay_order_id)
        .eq("status", "PENDING");
      return jsonError("We couldn’t confirm the captured payment with Razorpay. Please wait a moment and retry verification from billing.", 400, {
        code: "PAYMENT_AUTHENTICITY_CHECK_FAILED",
        retryable: true,
      });
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
      return jsonError("We couldn’t find the matching checkout record for this payment. Please contact support with your Razorpay payment ID if funds were debited.", 404, {
        code: "PENDING_PAYMENT_NOT_FOUND",
      });
    }

    if (pendingPayment.status === "SUCCESS") {
      return NextResponse.json({ success: true, duplicate: true });
    }

    if (pendingPayment.status !== "PENDING") {
      return jsonError("This checkout session is no longer pending. Please refresh billing before trying again.", 409, { code: "PAYMENT_NOT_PENDING" });
    }

    const plan = getPlanById(pendingPayment.plan);
    if (!plan) {
      return jsonError("The payment record references an invalid plan. Please contact support before retrying checkout.", 400, { code: "INVALID_PAYMENT_PLAN" });
    }
    const activation = buildActivationPayload(plan.id);

    const nowIso = new Date().toISOString();
    const nextRenewal = computeNextRenewalDate();

    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .update({
        status: "SUCCESS",
        razorpay_transaction_id: body.razorpay_payment_id,
        subscription_id: razorpaySubscriptionId,
        updated_at: nowIso,
      } as never)
      .eq("id", pendingPayment.id)
      .eq("status", "PENDING");

    if (paymentError) {
      throw new Error(paymentError.message);
    }

    serverLog({
      level: "info",
      route: "api/billing/verify",
      message: "Payment marked as SUCCESS",
      metadata: {
        userId: user.id,
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
        paymentRowId: pendingPayment.id,
      },
    });

    const { data: subscriptionUpsert, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan_id: plan.id,
          plan_name: plan.id,
          status: "ACTIVE",
          renewal_date: nextRenewal,
          current_period_end: nextRenewal,
          next_renewal_at: nextRenewal,
          last_payment_at: nowIso,
          grace_until: null,
          cancel_at_period_end: false,
          billing_cycle: "monthly",
          razorpay_subscription_id: razorpaySubscriptionId,
          updated_at: nowIso,
        } as never,
        { onConflict: "user_id" }
      )
      .select("id,user_id,plan_id,status,next_renewal_at")
      .maybeSingle<{ id: string; user_id: string; plan_id: string; status: string; next_renewal_at: string | null }>();

    if (subscriptionError) {
      throw new Error(subscriptionError.message);
    }

    serverLog({
      level: "info",
      route: "api/billing/verify",
      message: "Subscription upsert completed",
      metadata: {
        userId: user.id,
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
        subscriptionId: subscriptionUpsert?.id ?? null,
        subscriptionStatus: subscriptionUpsert?.status ?? null,
        subscriptionPlan: subscriptionUpsert?.plan_id ?? null,
        razorpaySubscriptionId,
      },
    });

    const creditResult = await assignPlanCredits(user.id, plan.id, `subscription:${body.razorpay_payment_id}`);

    serverLog({
      level: "info",
      route: "api/billing/verify",
      message: "Credits assignment completed",
      metadata: {
        userId: user.id,
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
        razorpaySubscriptionId,
        allocatedCredits: creditResult.allocatedCredits,
        nextBalance: creditResult.nextBalance,
        reference: creditResult.reference,
      },
    });

    let entitlementRefreshResult: "ok" | "failed" = "ok";
    try {
      revalidatePath("/billing");
      revalidatePath("/dashboard");
    } catch (refreshError) {
      entitlementRefreshResult = "failed";
      serverLog({
        level: "warn",
        route: "api/billing/verify",
        message: "Entitlement refresh revalidation failed",
        error: refreshError,
        metadata: {
          userId: user.id,
          orderId: body.razorpay_order_id,
          paymentId: body.razorpay_payment_id,
        },
      });
    }

    serverLog({
      level: "info",
      route: "api/billing/verify",
      message: "Entitlement refresh completed",
      metadata: {
        userId: user.id,
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
        entitlementRefreshResult,
      },
    });

    serverLog({
      level: "info",
      route: "api/billing/verify",
      message: "Subscription activation result",
      metadata: {
        userId: user.id,
        planId: activation.planId,
        amountPaise: plan.amountPaise,
        credits: activation.credits,
        premiumLabel: activation.premiumLabel,
        paymentId: body.razorpay_payment_id,
        orderId: body.razorpay_order_id,
        razorpaySubscriptionId,
        subscriptionUpsertResult: subscriptionUpsert?.status ?? null,
        creditsAssignmentResult: {
          allocatedCredits: creditResult.allocatedCredits,
          nextBalance: creditResult.nextBalance,
        },
        entitlementRefreshResult,
      },
    });

    return NextResponse.json({
      success: true,
      billing: {
        subscription: {
          planId: activation.planId,
          planName: activation.displayName,
          status: "ACTIVE",
          renewalAt: nextRenewal,
          credits: activation.credits,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Payment verification payload is invalid.", 400, { code: "INVALID_VERIFICATION_PAYLOAD" });
    }

    serverLog({ level: "error", route: "api/billing/verify", message: "Billing verification failed", error });
    return jsonError("We couldn’t finalize the payment confirmation right now. Please retry once from billing in a few seconds.", 500, {
      code: "BILLING_VERIFICATION_FAILED",
      retryable: true,
    });
  }
}