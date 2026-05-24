import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { assignPlanCredits, computeGraceExpiryDate, computeNextRenewalDate } from "@/lib/billing/service";
import { serverLog } from "@/lib/logger";

type SyncResult = {
  status: "processed" | "duplicate" | "ignored";
  userId: string | null;
  subscriptionId: string | null;
  paymentId: string | null;
};

type RazorpayWebhookEvent = {
  event: string;
  account_id?: string;
  created_at?: number;
  payload: Record<string, unknown>;
};

function objectValue(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

function isoFromUnix(value?: number | null): string | null {
  if (!value || Number.isNaN(value)) return null;
  return new Date(value * 1000).toISOString();
}

function buildEventId(event: RazorpayWebhookEvent, paymentId: string | null, subscriptionId: string | null) {
  const baseEntity = paymentId ?? subscriptionId ?? "na";
  return `${event.event}:${baseEntity}:${event.created_at ?? "na"}`;
}

export class BillingSyncService {
  private readonly supabase = getSupabaseAdmin();

  private async claimEvent(eventId: string, eventType: string, payload: Record<string, unknown>, paymentId: string | null, subscriptionId: string | null) {
    const nowIso = new Date().toISOString();
    const { data: inserted, error } = await this.supabase
      .from("billing_events")
      .insert({
        event_id: eventId,
        event_type: eventType,
        payload,
        razorpay_payment_id: paymentId,
        razorpay_subscription_id: subscriptionId,
        processing_status: "processing",
        verification_result: "verified",
        processed_at: nowIso,
      } as never)
      .select("id")
      .maybeSingle<{ id: string }>();

    if (!error && inserted?.id) return { duplicate: false, rowId: inserted.id };

    if (String((error as { code?: string } | null)?.code) === "23505") {
      return { duplicate: true, rowId: null };
    }

    if (error) throw new Error(error.message);
    throw new Error("Unable to claim billing event");
  }

  private async markEventSuccess(eventId: string, userId: string | null, status: "processed" | "ignored" | "duplicate") {
    await this.supabase
      .from("billing_events")
      .update({ processing_status: status, user_id: userId, failure_reason: null, processed_at: new Date().toISOString() } as never)
      .eq("event_id", eventId);
  }

  private async markEventFailure(eventId: string, reason: string) {
    const { data: row } = await this.supabase
      .from("billing_events")
      .select("retry_count")
      .eq("event_id", eventId)
      .maybeSingle<{ retry_count: number | null }>();
    const retries = (row?.retry_count ?? 0) + 1;

    await this.supabase
      .from("billing_events")
      .update({
        processing_status: retries >= 5 ? "failed" : "retrying",
        retry_count: retries,
        failure_reason: reason.slice(0, 1000),
        processed_at: new Date().toISOString(),
      } as never)
      .eq("event_id", eventId);
  }

  private async findSubscriptionContext(subscriptionId: string | null) {
    if (!subscriptionId) return { userId: null as string | null, planName: null as string | null };
    const { data } = await this.supabase
      .from("subscriptions")
      .select("user_id,plan_name")
      .eq("razorpay_subscription_id", subscriptionId)
      .maybeSingle<{ user_id: string; plan_name: string }>();
    return { userId: data?.user_id ?? null, planName: data?.plan_name ?? null };
  }

  private async paymentAlreadySuccessful(razorpayPaymentId: string | null) {
    if (!razorpayPaymentId) return false;
    const { data } = await this.supabase
      .from("payments")
      .select("id")
      .eq("razorpay_transaction_id", razorpayPaymentId)
      .in("status", ["SUCCESS", "CREDIT_TOPUP"])
      .maybeSingle<{ id: string }>();
    return Boolean(data?.id);
  }

  async process(event: RazorpayWebhookEvent): Promise<SyncResult> {
    const eventType = event.event;
    const payload = objectValue(event.payload);
    const paymentEntity = objectValue(objectValue(payload.payment).entity);
    const subscriptionEntity = objectValue(objectValue(payload.subscription).entity);

    const razorpayPaymentId = (paymentEntity.id as string | undefined) ?? null;
    const razorpaySubscriptionId =
      (subscriptionEntity.id as string | undefined) ?? (paymentEntity.subscription_id as string | undefined) ?? null;

    const eventId = buildEventId(event, razorpayPaymentId, razorpaySubscriptionId);
    const claim = await this.claimEvent(eventId, eventType, payload, razorpayPaymentId, razorpaySubscriptionId);
    if (claim.duplicate) {
      return { status: "duplicate", userId: null, subscriptionId: razorpaySubscriptionId, paymentId: razorpayPaymentId };
    }

    try {
      const supported = new Set([
        "payment.captured",
        "payment.failed",
        "subscription.activated",
        "subscription.cancelled",
        "subscription.charged",
        "refund.processed",
      ]);
      if (!supported.has(eventType)) {
        await this.markEventSuccess(eventId, null, "ignored");
        return { status: "ignored", userId: null, subscriptionId: razorpaySubscriptionId, paymentId: razorpayPaymentId };
      }

      const { userId, planName } = await this.findSubscriptionContext(razorpaySubscriptionId);
      const nowIso = new Date().toISOString();

      if (!userId || !planName) {
        await this.markEventSuccess(eventId, null, "ignored");
        return { status: "ignored", userId: null, subscriptionId: razorpaySubscriptionId, paymentId: razorpayPaymentId };
      }

      if (eventType === "payment.captured" || eventType === "subscription.charged") {
        if (!razorpayPaymentId) throw new Error("Missing razorpay payment id");

        const duplicatePayment = await this.paymentAlreadySuccessful(razorpayPaymentId);
        if (!duplicatePayment) {
          const nextRenewal =
            isoFromUnix((subscriptionEntity.current_end as number | undefined) ?? undefined) ?? computeNextRenewalDate();

          const { error: paymentErr } = await this.supabase.from("payments").upsert(
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
          );
          if (paymentErr) throw new Error(`Payment upsert failed: ${paymentErr.message}`);

          await this.supabase
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

          await assignPlanCredits(userId, planName, `subscription:${razorpayPaymentId}`);
        }
      }

      if (eventType === "payment.failed") {
        const graceUntil = computeGraceExpiryDate();
        await Promise.all([
          this.supabase
            .from("subscriptions")
            .update({ status: "PAST_DUE", grace_until: graceUntil, updated_at: nowIso } as never)
            .eq("user_id", userId),
          this.supabase.from("payments").upsert(
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
        const currentPeriodEnd = isoFromUnix((subscriptionEntity.current_end as number | undefined) ?? undefined);
        const nextRenewal = currentPeriodEnd ?? computeNextRenewalDate();
        await this.supabase
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

      if (eventType === "subscription.cancelled") {
        await this.supabase
          .from("subscriptions")
          .update({
            status: "CANCELLED",
            cancel_at_period_end: true,
            next_renewal_at: null,
            updated_at: nowIso,
          } as never)
          .eq("user_id", userId);
      }

      if (eventType === "refund.processed") {
        await this.supabase
          .from("payments")
          .update({ status: "REFUNDED", updated_at: nowIso } as never)
          .eq("razorpay_transaction_id", razorpayPaymentId ?? "");
      }

      await this.markEventSuccess(eventId, userId, "processed");
      return { status: "processed", userId, subscriptionId: razorpaySubscriptionId, paymentId: razorpayPaymentId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown webhook sync error";
      await this.markEventFailure(eventId, message);
      serverLog({
        level: "error",
        route: "lib/billing/sync-service",
        message: "Billing sync event failed",
        error,
        metadata: { eventId, eventType },
      });
      throw error;
    }
  }
}
