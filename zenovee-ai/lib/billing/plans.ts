export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "past_due";

export type PaymentStatus = "created" | "pending" | "success" | "failed" | "refunded";

export interface BillingPlan {
  id: string;
  name: string;
  monthlyPriceRupees: number;
  amountPaise: number;
  credits: number;
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
  planId: string;
  status: SubscriptionStatus;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  razorpaySubscriptionId?: string | null;
}

export const PLANS: BillingPlan[] = [
  {
    id: "starter",
    name: "STARTER",
    monthlyPriceRupees: 299,
    amountPaise: 299 * 100,
    credits: 40,
    features: ["Starter limits", "Core tools access", "Monthly credit reset"],
    razorpayPlanId: null,
    active: true,
  },
  {
    id: "growth",
    name: "GROWTH",
    monthlyPriceRupees: 799,
    amountPaise: 799 * 100,
    credits: 150,
    features: ["Advanced usage", "Higher monthly limits", "Priority processing"],
    razorpayPlanId: null,
    active: true,
  },
  {
    id: "scale",
    name: "SCALE",
    monthlyPriceRupees: 1999,
    amountPaise: 1999 * 100,
    credits: 500,
    features: ["Premium access", "Highest limits", "Dedicated support lane"],
    razorpayPlanId: null,
    active: true,
  },
];

export function getPlanById(id: string) {
  return PLANS.find((plan) => plan.id === id.toLowerCase());
}

export function getActivePlans() {
  return PLANS.filter((plan) => plan.active);
}

export function formatRupees(amountRupees: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amountRupees);
}

export function hasActiveSubscription(subscription?: Pick<UserSubscription, "status"> | null) {
  return subscription?.status === "active";
}
