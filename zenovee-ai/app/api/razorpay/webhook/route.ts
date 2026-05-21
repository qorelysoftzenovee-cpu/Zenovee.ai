import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { assignPlanCredits, computeGraceExpiryDate, computeNextRenewalDate } from "@/services/billing";
import { verifyWebhookSignature } from "@/services/razorpay";
import { serverLog } from "@/lib/logger";

type RazorpayEvent = {
  event?: string;
  created_at?: number;
  account_id?: string;
  payload?: Record<string, unknown>;
};

function jsonValue(input: unknown): Record<string, unknown> {
  return (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
}

function toIsoFromUnixSeconds(value?: number | null): string | null {
  if (!value || Number.isNaN(value)) return null;
  return new Date(value * 1000).toISOString();
}

function getEventId(event: RazorpayEvent, paymentId: string | null, subscriptionId: string | null) {
  const payload = jsonValue(event.payload);
  const payment = jsonValue(jsonValue(payload.payment).entity);
  const subscription = jsonValue(jsonValue(payload.subscription).entity);
  const entityId =
    (payment.id as string | undefined) ??
    (subscription.id as string | undefined) ??
    paymentId ??
    subscriptionId ??
    "na";

  return `${event.event ?? "unknown"}:${entityId}:${event.created_at ?? "na"}`;
}

async function wasPaymentAlreadyProcessed(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  razorpayPaymentId: string | null
) {
  if (!razorpayPaymentId) {
    return false;
  }

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
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
    }

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    let event: RazorpayEvent;
    try {
      event = JSON.parse(rawBody) as RazorpayEvent;
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const eventType = event.event ?? "unknown";
    const supportedEvents = new Set([
      "payment.captured",
      "payment.failed",
      "subscription.activated",
      "subscription.charged",
      "subscription.completed",
      "subscription.cancelled",
    ]);

    const payload = jsonValue(event.payload);
    const paymentEntity = jsonValue(jsonValue(payload.payment).entity);
    const subscriptionEntity = jsonValue(jsonValue(payload.subscription).entity);

    const razorpaySubscriptionId =
      (subscriptionEntity.id as string | undefined) ?? (paymentEntity.subscription_id as string | undefined) ?? null;
    const razorpayPaymentId = (paymentEntity.id as string | undefined) ?? null;

    const eventId = getEventId(event, razorpayPaymentId, razorpaySubscriptionId);
    const supabaseAdmin = getSupabaseAdmin();
    const nowIso = new Date().toISOString();
    let processingStatus: "processed" | "duplicate" | "ignored" | "failed" = supportedEvents.has(eventType) ? "processed" : "ignored";

    const { data: existingEvent } = await supabaseAdmin
      .from("billing_events")
      .select("id")
      .eq("event_id", eventId)
      .maybeSingle<{ id: string }>();

    if (existingEvent) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    const { data: sub } = razorpaySubscriptionId
      ? await supabaseAdmin
          .from("subscriptions")
          .select("user_id,plan_name")
          .eq("razorpay_subscription_id", razorpaySubscriptionId)
          .maybeSingle<{ user_id: string; plan_name: string }>()
      : { data: null };

    const userId = sub?.user_id ?? null;
    const planName = sub?.plan_name ?? null;

    if (supportedEvents.has(eventType) && userId && planName) {
      if (eventType === "payment.captured" || eventType === "subscription.charged") {
        const alreadyProcessed = await wasPaymentAlreadyProcessed(supabaseAdmin, razorpayPaymentId);

        if (alreadyProcessed) {
          processingStatus = "duplicate";
        } else {
        const nextRenewal =
          toIsoFromUnixSeconds((subscriptionEntity.current_end as number | undefined) ?? undefined) ?? computeNextRenewalDate();

        const { data: paymentRow, error: paymentErr } = await supabaseAdmin
          .from("payments")
          .upsert(
            {
              user_id: userId,
              payment_amount: Number(paymentEntity.amount ? Number(paymentEntity.amount) / 100 : 0),
              plan: planName,
              currency: (paymentEntity.currency as string | undefined) ?? "INR",
              status: "SUCCESS",
              razorpay_transaction_id: razorpayPaymentId,
              subscription_id: razorpaySubscriptionId,
              invoice_id: (paymentEntity.invoice_id as string | undefined) ?? null,
              updated_at: nowIso,
            } as never,
            { onConflict: "razorpay_transaction_id" }
          )
          .select("id")
          .maybeSingle<{ id: string }>();

        if (paymentErr) throw new Error(`Payment upsert failed: ${paymentErr.message}`);

        await supabaseAdmin
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
          .eq("user_id", userId);

        await assignPlanCredits(userId, planName, `subscription:${razorpayPaymentId ?? razorpaySubscriptionId ?? eventId}`);

        if (!paymentRow?.id) {
          throw new Error("Payment persisted without id");
        }
        }
      }

      if (eventType === "payment.failed") {
        const graceUntil = computeGraceExpiryDate();
        await Promise.all([
          supabaseAdmin
            .from("subscriptions")
            .update({
              status: "PAST_DUE",
              grace_until: graceUntil,
              updated_at: nowIso,
            } as never)
            .eq("user_id", userId),
          supabaseAdmin.from("payments").upsert(
            {
              user_id: userId,
              payment_amount: Number(paymentEntity.amount ? Number(paymentEntity.amount) / 100 : 0),
              plan: planName,
              currency: (paymentEntity.currency as string | undefined) ?? "INR",
              status: "FAILED",
              razorpay_transaction_id: razorpayPaymentId,
              subscription_id: razorpaySubscriptionId,
              invoice_id: (paymentEntity.invoice_id as string | undefined) ?? null,
              failure_reason:
                (paymentEntity.error_description as string | undefined) ??
                (paymentEntity.error_reason as string | undefined) ??
                "PAYMENT_FAILED",
              updated_at: nowIso,
            } as never,
            { onConflict: "razorpay_transaction_id" }
          ),
        ]);
      }

      if (eventType === "subscription.activated") {
        const currentPeriodEnd = toIsoFromUnixSeconds((subscriptionEntity.current_end as number | undefined) ?? undefined);
        const nextRenewal = currentPeriodEnd ?? computeNextRenewalDate();

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "ACTIVE",
            renewal_date: nextRenewal,
            current_period_end: currentPeriodEnd ?? nextRenewal,
            next_renewal_at: nextRenewal,
            grace_until: null,
            cancel_at_period_end: false,
            updated_at: nowIso,
          } as never)
          .eq("user_id", userId);
      }

      if (eventType === "subscription.completed" || eventType === "subscription.cancelled") {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "CANCELLED",
            cancel_at_period_end: true,
            next_renewal_at: null,
            updated_at: nowIso,
          } as never)
          .eq("user_id", userId);
      }
    }

    const { error: eventErr } = await supabaseAdmin.from("billing_events").insert({
      event_id: eventId,
      event_type: eventType,
      user_id: userId,
      razorpay_subscription_id: razorpaySubscriptionId,
      razorpay_payment_id: razorpayPaymentId,
      payload,
      processing_status: processingStatus,
      processed_at: nowIso,
    } as never);

    if (eventErr) {
      if (String((eventErr as { code?: string }).code) === "23505") {
        return NextResponse.json({ success: true, duplicate: true });
      }
      throw new Error(eventErr.message);
    }

    return NextResponse.json({ success: true, received: true, handled: supportedEvents.has(eventType), duplicate: processingStatus === "duplicate" });
  } catch (error) {
    serverLog({
      level: "error",
      route: "api/razorpay/webhook",
      message: "Webhook processing failed",
      error,
    });

    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
  }
}
