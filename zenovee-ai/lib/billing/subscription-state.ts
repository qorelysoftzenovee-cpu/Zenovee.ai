import { getPlanById, getPlanDisplayName, resolvePlanId } from "@/lib/billing/plans";

export type RawSubscriptionLike = {
  plan_id?: string | null;
  plan_name?: string | null;
  status?: string | null;
  current_period_end?: string | null;
  next_renewal_at?: string | null;
  grace_until?: string | null;
  cancel_at_period_end?: boolean | null;
  razorpay_subscription_id?: string | null;
};

export type NormalizedSubscriptionState = {
  planId: string | null;
  planName: string | null;
  status: string | null;
  normalizedStatus: "active" | "pending" | "past_due" | "cancelled" | "expired" | "inactive";
  isActive: boolean;
  isPending: boolean;
  currentPeriodEnd: string | null;
  nextRenewalAt: string | null;
  graceUntil: string | null;
  cancelAtPeriodEnd: boolean;
  razorpaySubscriptionId: string | null;
};

export function normalizeSubscriptionState(subscription?: RawSubscriptionLike | null): NormalizedSubscriptionState {
  const rawStatus = String(subscription?.status ?? "").trim().toUpperCase();
  const normalizedPlanId = resolvePlanId(subscription?.plan_id ?? subscription?.plan_name ?? null);
  const normalizedStatus =
    rawStatus === "ACTIVE"
      ? "active"
      : rawStatus === "PENDING"
      ? "pending"
      : rawStatus === "PAST_DUE"
      ? "past_due"
      : rawStatus === "CANCELLED" || rawStatus === "CANCELED"
      ? "cancelled"
      : rawStatus === "EXPIRED"
      ? "expired"
      : "inactive";

  return {
    planId: normalizedPlanId,
    planName: normalizedPlanId ? getPlanDisplayName(normalizedPlanId) : subscription?.plan_name?.trim() || null,
    status: rawStatus || null,
    normalizedStatus,
    isActive: normalizedStatus === "active",
    isPending: normalizedStatus === "pending",
    currentPeriodEnd: subscription?.current_period_end ?? null,
    nextRenewalAt: subscription?.next_renewal_at ?? null,
    graceUntil: subscription?.grace_until ?? null,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    razorpaySubscriptionId: subscription?.razorpay_subscription_id ?? null,
  };
}

export function getSubscriptionPlanRecord(subscription?: RawSubscriptionLike | null) {
  const normalized = normalizeSubscriptionState(subscription);
  return normalized.planId ? getPlanById(normalized.planId) ?? null : null;
}