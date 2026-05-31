import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getToolDefinition } from "@/definitions";
import { getPlanById } from "@/lib/billing/plans";
import { computeNextRenewalDate } from "@/lib/billing/service";

export type BillingGateCode =
  | "OK"
  | "SUBSCRIPTION_REQUIRED"
  | "TOOL_DISABLED"
  | "INSUFFICIENT_CREDITS"
  | "COOLDOWN_ACTIVE";

export type ToolCreditRule = {
  toolId: string;
  creditCost: number;
  cooldownSeconds: number;
  active: boolean;
};

export type BillingSnapshot = {
  plan: string | null;
  subscriptionStatus: string | null;
  hasActiveSubscription: boolean;
  renewalAt: string | null;
  availableCredits: number;
  totalCredits: number;
  usedCredits: number;
  subscriptionLookupResult: {
    subscriptionFound: boolean;
    paymentFound: boolean;
    rawSubscriptionStatus: string | null;
    fallbackActive: boolean;
  };
};

export type ToolEntitlementResult = {
  allowed: boolean;
  code: BillingGateCode;
  message?: string;
  denialReason?: string;
  creditCost: number;
  remainingCredits: number;
  cooldownRemainingSeconds: number;
  billing: BillingSnapshot;
};

export class ToolExecutionAccessError extends Error {
  code: BillingGateCode;
  denialReason?: string;
  toolId: string;
  currentBalance: number;
  requiredCredits: number;

  constructor(params: {
    message: string;
    code: BillingGateCode;
    denialReason?: string;
    toolId: string;
    currentBalance: number;
    requiredCredits: number;
  }) {
    super(params.message);
    this.name = "ToolExecutionAccessError";
    this.code = params.code;
    this.denialReason = params.denialReason;
    this.toolId = params.toolId;
    this.currentBalance = params.currentBalance;
    this.requiredCredits = params.requiredCredits;
  }
}

export async function getToolCreditRule(toolId: string): Promise<ToolCreditRule> {
  const supabase = getSupabaseAdmin();
  const tool = getToolDefinition(toolId);
  if (!tool) throw new Error("Requested tool was not found.");

  const { data } = await supabase
    .from("tool_pricing")
    .select("credits_cost,cooldown_seconds,is_active")
    .eq("tool_id", toolId)
    .maybeSingle<{ credits_cost: number; cooldown_seconds: number; is_active: boolean }>();

  return {
    toolId,
    creditCost: Number(data?.credits_cost ?? tool.creditCost),
    cooldownSeconds: Number(data?.cooldown_seconds ?? 0),
    active: tool.metadata.availability !== "coming_soon" && data?.is_active !== false,
  };
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const snapshot = await getBillingSnapshot(userId);
  return snapshot.hasActiveSubscription;
}

export async function getRemainingCredits(userId: string): Promise<number> {
  const snapshot = await getBillingSnapshot(userId);
  return snapshot.availableCredits;
}

export async function requireCredits(userId: string, required: number) {
  const remaining = await getRemainingCredits(userId);
  if (remaining < required) {
    const error = new Error("Insufficient credits for this tool execution.");
    error.name = "INSUFFICIENT_CREDITS";
    throw error;
  }
  return remaining;
}

export async function canUseTool(userId: string, toolId: string): Promise<ToolEntitlementResult> {
  const supabase = getSupabaseAdmin();
  const [rule, billing] = await Promise.all([
    getToolCreditRule(toolId),
    getBillingSnapshot(userId),
  ]);
  const remaining = billing.availableCredits;

  if (!rule.active) {
    return {
      allowed: false,
      code: "TOOL_DISABLED",
      message: "This tool is temporarily disabled.",
      denialReason: "tool_disabled",
      creditCost: rule.creditCost,
      remainingCredits: remaining,
      cooldownRemainingSeconds: 0,
      billing,
    };
  }
  if (!billing.hasActiveSubscription) {
    return {
      allowed: false,
      code: "SUBSCRIPTION_REQUIRED",
      message: "An active subscription is required.",
      denialReason: billing.subscriptionLookupResult.fallbackActive ? "subscription_not_marked_active_despite_fallback" : "no_active_subscription",
      creditCost: rule.creditCost,
      remainingCredits: remaining,
      cooldownRemainingSeconds: 0,
      billing,
    };
  }
  if (remaining < rule.creditCost) {
    return {
      allowed: false,
      code: "INSUFFICIENT_CREDITS",
      message: "You don't have enough credits.",
      denialReason: "insufficient_credits",
      creditCost: rule.creditCost,
      remainingCredits: remaining,
      cooldownRemainingSeconds: 0,
      billing,
    };
  }

  if (rule.cooldownSeconds > 0) {
    const cutoff = new Date(Date.now() - rule.cooldownSeconds * 1000).toISOString();
    const { data: recent } = await supabase
      .from("tool_executions")
      .select("created_at")
      .eq("user_id", userId)
      .eq("tool_id", toolId)
      .gte("created_at", cutoff)
      .in("status", ["pending", "running", "success"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ created_at: string }>();

    if (recent?.created_at) {
      const retryAfterSeconds = Math.max(1, Math.ceil((new Date(recent.created_at).getTime() + rule.cooldownSeconds * 1000 - Date.now()) / 1000));
      return {
        allowed: false,
        code: "COOLDOWN_ACTIVE",
        message: `Please wait ${retryAfterSeconds}s before running this tool again.`,
        denialReason: "cooldown_active",
        creditCost: rule.creditCost,
        remainingCredits: remaining,
        cooldownRemainingSeconds: retryAfterSeconds,
        billing,
      };
    }
  }

  return { allowed: true, code: "OK", creditCost: rule.creditCost, remainingCredits: remaining, cooldownRemainingSeconds: 0, billing };
}

export async function getBillingSnapshot(userId: string): Promise<BillingSnapshot> {
  const supabase = getSupabaseAdmin();
  const [{ data: sub }, { data: credits }, { data: latestSuccessfulPayment }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan_id,plan_name,status,next_renewal_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ plan_id?: string | null; plan_name?: string | null; status: string; next_renewal_at: string | null }>(),
    supabase
      .from("user_credits")
      .select("available_credits,total_credits,used_credits")
      .eq("user_id", userId)
      .maybeSingle<{ available_credits: number; total_credits: number; used_credits: number }>(),
    supabase
      .from("payments")
      .select("plan,status")
      .eq("user_id", userId)
      .eq("status", "SUCCESS")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ plan: string; status: string }>(),
  ]);

  const resolvedPlan = sub?.plan_id ?? sub?.plan_name ?? latestSuccessfulPayment?.plan ?? null;
  const hasSuccessfulPayment = latestSuccessfulPayment?.status === "SUCCESS";
  const rawSubscriptionStatus = String(sub?.status ?? "").trim().toUpperCase();
  const subscriptionIsAlreadyUsable = rawSubscriptionStatus === "ACTIVE" || rawSubscriptionStatus === "PAST_DUE";
  const fallbackActive = Boolean(resolvedPlan) && hasSuccessfulPayment && !subscriptionIsAlreadyUsable;
  const effectiveStatus = subscriptionIsAlreadyUsable
    ? rawSubscriptionStatus
    : fallbackActive
    ? "ACTIVE"
    : rawSubscriptionStatus || null;
  const planRecord = resolvedPlan ? getPlanById(resolvedPlan) ?? null : null;
  const rawAvailableCredits = Number(credits?.available_credits ?? 0);
  const rawTotalCredits = Number(credits?.total_credits ?? 0);
  const rawUsedCredits = Number(credits?.used_credits ?? 0);
  const shouldInferCredits = Boolean(planRecord) && hasSuccessfulPayment && rawTotalCredits === 0 && rawAvailableCredits === 0;
  const inferredTotalCredits = shouldInferCredits ? Number(planRecord?.credits ?? 0) : rawTotalCredits;

  const effectiveRenewalAt = sub?.next_renewal_at ?? (hasSuccessfulPayment ? computeNextRenewalDate() : null);

  return {
    plan: resolvedPlan,
    subscriptionStatus: effectiveStatus,
    hasActiveSubscription: effectiveStatus === "ACTIVE" || effectiveStatus === "PAST_DUE",
    renewalAt: effectiveRenewalAt,
    availableCredits: rawAvailableCredits,
    totalCredits: inferredTotalCredits,
    usedCredits: rawUsedCredits,
    subscriptionLookupResult: {
      subscriptionFound: Boolean(sub),
      paymentFound: Boolean(latestSuccessfulPayment),
      rawSubscriptionStatus: rawSubscriptionStatus || null,
      fallbackActive,
    },
  };
}
