import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlanById } from "@/app/subscription-plans";
import { createRazorpayPlanIfMissing } from "@/services/razorpay";
import { serverLog } from "@/lib/logger";

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

  const { data: current } = await supabaseAdmin
    .from("user_credits")
    .select("total_credits,used_credits,available_credits")
    .eq("user_id", userId)
    .maybeSingle<{ total_credits: number; used_credits: number; available_credits: number }>();

  const before = Number(current?.available_credits ?? 0);
  const used = Number(current?.used_credits ?? 0);
  const total = used + plan.credits;

  const { error: aggregateErr } = await supabaseAdmin.from("user_credits").upsert(
    {
      user_id: userId,
      total_credits: total,
      used_credits: used,
      available_credits: plan.credits,
      updated_at: nowIso,
    } as never,
    { onConflict: "user_id" }
  );

  if (aggregateErr) {
    serverLog({ level: "error", route: "services/billing.assignPlanCredits", message: "user_credits upsert failed", error: aggregateErr });
    throw new Error(aggregateErr.message);
  }

  const [{ error: txErr }, { error: legacyErr }, { error: userErr }] = await Promise.all([
    supabaseAdmin.from("credit_transactions").insert({
      user_id: userId,
      transaction_type: "subscription_credit",
      credits: plan.credits,
      balance_before: before,
      balance_after: plan.credits,
      plan_id: appPlanId,
      reference: `plan_allocation:${appPlanId}`,
      metadata: { source: "webhook" },
    } as never),
    supabaseAdmin.from("credits").insert({
      user_id: userId,
      credits_added: plan.credits,
      credits_consumed: 0,
      remaining_balance: plan.credits,
      reason: `plan_allocation:${appPlanId}`,
      reset_interval: "monthly",
      reset_date: computeNextRenewalDate(),
      updated_at: nowIso,
    } as never),
    supabaseAdmin
      .from("users")
      .update({ credits_balance: plan.credits, plan: appPlanId, updated_at: nowIso } as never)
      .eq("id", userId),
  ]);

  if (txErr) {
    serverLog({ level: "error", route: "services/billing.assignPlanCredits", message: "credit_transactions insert failed", error: txErr });
    throw new Error(txErr.message);
  }

  if (legacyErr) {
    serverLog({ level: "error", route: "services/billing.assignPlanCredits", message: "credits insert failed", error: legacyErr });
    throw new Error(legacyErr.message);
  }

  if (userErr) {
    serverLog({ level: "error", route: "services/billing.assignPlanCredits", message: "users update failed", error: userErr });
    throw new Error(userErr.message);
  }
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
