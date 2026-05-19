import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlanById } from "@/app/subscription-plans";
import { createRazorpayPlanIfMissing } from "@/services/razorpay";
import { serverLog } from "@/lib/logger";

type SupabaseRpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

const GRACE_DAYS = 3;

export async function getOrCreateRazorpayPlanId(appPlanId: string) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: existing } = await supabaseAdmin
    .from("billing_plans")
    .select("app_plan_id,razorpay_plan_id")
    .eq("app_plan_id", appPlanId)
    .maybeSingle<{ app_plan_id: string; razorpay_plan_id: string }>();

  if (existing?.razorpay_plan_id) return existing.razorpay_plan_id;

  const razorpayPlanId = await createRazorpayPlanIfMissing(appPlanId);

  await supabaseAdmin.from("billing_plans").upsert(
    {
      app_plan_id: appPlanId,
      razorpay_plan_id: razorpayPlanId,
    } as never,
    { onConflict: "app_plan_id" }
  );

  return razorpayPlanId;
}

export async function assignPlanCredits(userId: string, appPlanId: string) {
  const plan = getPlanById(appPlanId);
  if (!plan) throw new Error("Invalid plan");

  const supabaseAdmin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();
  const supabaseRpc = supabaseAdmin as unknown as SupabaseRpcClient;
  const nextResetAt = computeNextRenewalDate();

  const { data: allocationData, error: allocationErr } = await supabaseRpc.rpc("allocate_subscription_credits", {
    p_user_id: userId,
    p_credits: plan.credits,
    p_plan_id: appPlanId,
    p_reference: `plan_allocation:${appPlanId}`,
    p_reset_at: nextResetAt,
    p_metadata: { source: "webhook", planName: plan.name },
  });

  if (allocationErr) {
    serverLog({ level: "error", route: "services/billing.assignPlanCredits", message: "allocate_subscription_credits failed", error: allocationErr });
    throw new Error(allocationErr.message);
  }

  const allocation = (Array.isArray(allocationData) ? allocationData[0] : allocationData) as { balance_after?: number } | null;
  const nextBalance = Number(allocation?.balance_after ?? plan.credits);

  const [{ error: legacyErr }, { error: userErr }] = await Promise.all([
    supabaseAdmin.from("credits").insert({
      user_id: userId,
      credits_added: plan.credits,
      credits_consumed: 0,
      remaining_balance: nextBalance,
      reason: `plan_allocation:${appPlanId}`,
      reset_interval: "monthly",
      reset_date: nextResetAt,
      updated_at: nowIso,
    } as never),
    supabaseAdmin
      .from("users")
      .update({ credits_balance: nextBalance, plan: appPlanId, updated_at: nowIso } as never)
      .eq("id", userId),
  ]);

  if (legacyErr) throw new Error(legacyErr.message);
  if (userErr) throw new Error(userErr.message);
}

export async function addTopupCredits(userId: string, topupId: string, credits: number, reference: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();
  const supabaseRpc = supabaseAdmin as unknown as SupabaseRpcClient;

  const { data, error } = await supabaseRpc.rpc("add_topup_credits", {
    p_user_id: userId,
    p_credits: credits,
    p_plan_id: `topup:${topupId}`,
    p_reference: reference,
    p_metadata: { source: "topup_verify", topupId },
  });

  if (error) {
    serverLog({ level: "error", route: "services/billing.addTopupCredits", message: "add_topup_credits failed", error });
    throw new Error(error.message);
  }

  const row = (Array.isArray(data) ? data[0] : data) as { balance_after?: number } | null;
  const nextBalance = Number(row?.balance_after ?? credits);

  await Promise.all([
    supabaseAdmin.from("credits").insert({
      user_id: userId,
      credits_added: credits,
      credits_consumed: 0,
      remaining_balance: nextBalance,
      reason: `credit_topup:${topupId}`,
      reset_interval: "monthly",
      updated_at: nowIso,
    } as never),
    supabaseAdmin.from("users").update({ credits_balance: nextBalance, updated_at: nowIso } as never).eq("id", userId),
  ]);

  return nextBalance;
}

export function computeNextRenewalDate(startAtMs = Date.now()) {
  const d = new Date(startAtMs);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export function computeGraceExpiryDate(startAtMs = Date.now()) {
  const d = new Date(startAtMs);
  d.setDate(d.getDate() + GRACE_DAYS);
  return d.toISOString();
}
