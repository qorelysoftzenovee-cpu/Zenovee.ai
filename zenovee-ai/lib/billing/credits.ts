import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getToolDefinition } from "@/definitions";

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
};

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
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .in("status", ["ACTIVE", "PAST_DUE"])
    .maybeSingle<{ status: string }>();
  return Boolean(data);
}

export async function getRemainingCredits(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("user_credits")
    .select("available_credits")
    .eq("user_id", userId)
    .maybeSingle<{ available_credits: number }>();
  return Number(data?.available_credits ?? 0);
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

export async function canUseTool(userId: string, toolId: string): Promise<{
  allowed: boolean;
  code: BillingGateCode;
  message?: string;
  creditCost: number;
  remainingCredits: number;
  cooldownRemainingSeconds: number;
}> {
  const supabase = getSupabaseAdmin();
  const [rule, subscribed, remaining] = await Promise.all([
    getToolCreditRule(toolId),
    hasActiveSubscription(userId),
    getRemainingCredits(userId),
  ]);

  if (!rule.active) {
    return { allowed: false, code: "TOOL_DISABLED", message: "This tool is temporarily disabled.", creditCost: rule.creditCost, remainingCredits: remaining, cooldownRemainingSeconds: 0 };
  }
  if (!subscribed) {
    return { allowed: false, code: "SUBSCRIPTION_REQUIRED", message: "An active subscription is required.", creditCost: rule.creditCost, remainingCredits: remaining, cooldownRemainingSeconds: 0 };
  }
  if (remaining < rule.creditCost) {
    return { allowed: false, code: "INSUFFICIENT_CREDITS", message: "You don't have enough credits.", creditCost: rule.creditCost, remainingCredits: remaining, cooldownRemainingSeconds: 0 };
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
        creditCost: rule.creditCost,
        remainingCredits: remaining,
        cooldownRemainingSeconds: retryAfterSeconds,
      };
    }
  }

  return { allowed: true, code: "OK", creditCost: rule.creditCost, remainingCredits: remaining, cooldownRemainingSeconds: 0 };
}

export async function getBillingSnapshot(userId: string): Promise<BillingSnapshot> {
  const supabase = getSupabaseAdmin();
  const [{ data: sub }, { data: credits }] = await Promise.all([
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
  ]);

  return {
    plan: sub?.plan_id ?? sub?.plan_name ?? null,
    subscriptionStatus: sub?.status ?? null,
    hasActiveSubscription: sub?.status === "ACTIVE" || sub?.status === "PAST_DUE",
    renewalAt: sub?.next_renewal_at ?? null,
    availableCredits: Number(credits?.available_credits ?? 0),
    totalCredits: Number(credits?.total_credits ?? 0),
    usedCredits: Number(credits?.used_credits ?? 0),
  };
}
