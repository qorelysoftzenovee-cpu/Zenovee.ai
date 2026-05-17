import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { assignPlanCredits, computeGraceExpiryDate, computeNextRenewalDate } from "@/services/billing";
import { verifyWebhookSignature } from "@/services/razorpay";

function jsonValue(input: unknown): Record<string, unknown> {
  return (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as { event?: string; payload?: Record<string, unknown>; created_at?: number };
  const eventType = event.event ?? "unknown";
  const payload = jsonValue(event.payload);

  const paymentEntity = jsonValue(jsonValue(payload.payment).entity);
  const subscriptionEntity = jsonValue(jsonValue(payload.subscription).entity);

  const razorpaySubscriptionId =
    (subscriptionEntity.id as string | undefined) ?? (paymentEntity.subscription_id as string | undefined) ?? null;
  const razorpayPaymentId = (paymentEntity.id as string | undefined) ?? null;

  const supabaseAdmin = getSupabaseAdmin();

  const { data: existingEvent } = await supabaseAdmin
    .from("billing_events")
    .select("id")
    .eq("event_id", `${eventType}:${razorpayPaymentId ?? "na"}:${event.created_at ?? Date.now()}`)
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

  const nowIso = new Date().toISOString();

  if (sub?.user_id) {
    if (eventType === "payment.captured" || eventType === "subscription.charged") {
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
          .eq("user_id", sub.user_id),
        supabaseAdmin.from("payments").insert({
          user_id: sub.user_id,
          payment_amount: Number(paymentEntity.amount ? Number(paymentEntity.amount) / 100 : 0),
          plan: sub.plan_name,
          currency: (paymentEntity.currency as string | undefined) ?? "INR",
          status: "SUCCESS",
          razorpay_transaction_id: razorpayPaymentId,
          subscription_id: razorpaySubscriptionId,
          invoice_id: (paymentEntity.invoice_id as string | undefined) ?? null,
        }),
        assignPlanCredits(sub.user_id, sub.plan_name),
      ]);
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
          .eq("user_id", sub.user_id),
        supabaseAdmin.from("payments").insert({
          user_id: sub.user_id,
          payment_amount: Number(paymentEntity.amount ? Number(paymentEntity.amount) / 100 : 0),
          plan: sub.plan_name,
          currency: (paymentEntity.currency as string | undefined) ?? "INR",
          status: "FAILED",
          razorpay_transaction_id: razorpayPaymentId,
          subscription_id: razorpaySubscriptionId,
          failure_reason: (paymentEntity.error_description as string | undefined) ?? "PAYMENT_FAILED",
        }),
      ]);
    }

    if (eventType === "subscription.cancelled" || eventType === "subscription.halted") {
      await supabaseAdmin
        .from("subscriptions")
        .update({ status: "CANCELLED", cancel_at_period_end: true, updated_at: nowIso } as never)
        .eq("user_id", sub.user_id);
    }
  }

  await supabaseAdmin.from("billing_events").insert({
    event_id: `${eventType}:${razorpayPaymentId ?? "na"}:${event.created_at ?? Date.now()}`,
    event_type: eventType,
    user_id: sub?.user_id ?? null,
    subscription_id: razorpaySubscriptionId,
    payment_id: razorpayPaymentId,
    payload,
    processed_at: nowIso,
  } as never);

  return NextResponse.json({ success: true });
}
