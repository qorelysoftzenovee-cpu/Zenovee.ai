export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "past_due";

export type PaymentStatus = "created" | "pending" | "success" | "failed" | "refunded";

export type BillingPlanId = "starter" | "growth" | "scale";

export type BillingPlanSupportLabel = "Standard" | "Most Popular" | "Agency / Power User";

export type BillingPlanSupportTier = "email" | "priority" | "concierge";

export type BillingPlanLimits = {
  hourly: number;
  daily: number;
};

export type PlanCheckoutPayload = {
  planId: BillingPlanId;
  displayName: string;
  amountPaise: number;
  monthlyPriceRupees: number;
  credits: number;
  currency: "INR";
};

export type PlanActivationPayload = {
  planId: BillingPlanId;
  displayName: string;
  credits: number;
  limits: BillingPlanLimits;
  supportTier: BillingPlanSupportTier;
  premiumLabel: BillingPlanSupportLabel;
};

export interface BillingPlan {
  id: BillingPlanId;
  name: string;
  displayName: string;
  monthlyPriceRupees: number;
  amountPaise: number;
  credits: number;
  limits: BillingPlanLimits;
  supportTier: BillingPlanSupportTier;
  premiumLabel?: BillingPlanSupportLabel;
  highlighted?: boolean;
  premiumPositioning: string;
  billingMetadata: {
    currency: "INR";
    interval: "monthly";
  };
  features: string[];
  razorpayPlanId: string | null;
  active: boolean;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  planId: string;
  status: PaymentStatus;
  amountPaise: number;
  currency: "INR";
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  razorpaySubscriptionId?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface UserSubscription {
  userId: string;
  planId: BillingPlanId;
  status: SubscriptionStatus;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  razorpaySubscriptionId?: string | null;
}

export const PLANS: BillingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    displayName: "Starter",
    monthlyPriceRupees: 899,
    amountPaise: 899 * 100,
    credits: 10_000,
    limits: { hourly: 24, daily: 160 },
    supportTier: "email",
    premiumLabel: "Standard",
    premiumPositioning: "Generous premium access for solo operators and early workflow scale.",
    billingMetadata: { currency: "INR", interval: "monthly" },
    features: ["Generous monthly credit balance", "Premium tool access across the workspace", "Secure self-serve billing"],
    razorpayPlanId: null,
    active: true,
  },
  {
    id: "growth",
    name: "Growth",
    displayName: "Growth",
    monthlyPriceRupees: 1999,
    amountPaise: 1999 * 100,
    credits: 35_000,
    limits: { hourly: 72, daily: 420 },
    supportTier: "priority",
    premiumLabel: "Most Popular",
    highlighted: true,
    premiumPositioning: "Best-value plan for serious weekly execution and multi-tool momentum.",
    billingMetadata: { currency: "INR", interval: "monthly" },
    features: ["Best-value premium credit economy", "Higher workflow throughput for growth teams", "Priority processing and faster execution confidence"],
    razorpayPlanId: null,
    active: true,
  },
  {
    id: "scale",
    name: "Scale",
    displayName: "Scale",
    monthlyPriceRupees: 2999,
    amountPaise: 2999 * 100,
    credits: 75_000,
    limits: { hourly: 140, daily: 900 },
    supportTier: "concierge",
    premiumLabel: "Agency / Power User",
    premiumPositioning: "Elite credit capacity for agencies, power users, and high-volume execution.",
    billingMetadata: { currency: "INR", interval: "monthly" },
    features: ["Elite monthly credit capacity", "High-volume execution for agency workflows", "Power-user throughput with premium support lane"],
    razorpayPlanId: null,
    active: true,
  },
];

const PLAN_MAP = new Map(PLANS.map((plan) => [plan.id, plan]));

export function resolvePlanId(id?: string | null): BillingPlanId | null {
  const normalized = id?.trim().toLowerCase();
  if (normalized === "starter" || normalized === "growth" || normalized === "scale") {
    return normalized;
  }
  return null;
}

export function getPlanById(id: string) {
  const planId = resolvePlanId(id);
  return planId ? PLAN_MAP.get(planId) : undefined;
}

export function getActivePlans() {
  return PLANS.filter((plan) => plan.active);
}

export function getPlanLimits(planId?: string | null) {
  const resolved = resolvePlanId(planId) ?? "starter";
  return PLAN_MAP.get(resolved)?.limits ?? PLANS[0].limits;
}

export function getPlanDisplayName(planId?: string | null) {
  const resolved = resolvePlanId(planId);
  return resolved ? PLAN_MAP.get(resolved)?.displayName ?? resolved : planId ?? "Unknown";
}

export function getPlanSupportText(planId?: string | null) {
  const tier = getPlanById(planId ?? "")?.supportTier;
  if (tier === "concierge") return "Concierge support";
  if (tier === "priority") return "Priority support";
  return "Email support";
}

export function getUpgradeablePlans(currentPlanId?: string | null) {
  const currentIndex = PLANS.findIndex((plan) => plan.id === resolvePlanId(currentPlanId));
  return PLANS.filter((plan, index) => plan.active && (currentIndex === -1 || index > currentIndex));
}

export function buildCheckoutPayload(planId: string): PlanCheckoutPayload {
  const plan = getPlanById(planId);
  if (!plan) throw new Error("Invalid plan");

  return {
    planId: plan.id,
    displayName: plan.displayName,
    amountPaise: plan.amountPaise,
    monthlyPriceRupees: plan.monthlyPriceRupees,
    credits: plan.credits,
    currency: plan.billingMetadata.currency,
  };
}

export function buildActivationPayload(planId: string): PlanActivationPayload {
  const plan = getPlanById(planId);
  if (!plan) throw new Error("Invalid plan");

  return {
    planId: plan.id,
    displayName: plan.displayName,
    credits: plan.credits,
    limits: plan.limits,
    supportTier: plan.supportTier,
    premiumLabel: plan.premiumLabel ?? "Standard",
  };
}

export function formatRupees(amountRupees: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amountRupees);
}

export function hasActiveSubscription(subscription?: Pick<UserSubscription, "status"> | null) {
  return subscription?.status === "active";
}
