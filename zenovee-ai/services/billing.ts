import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlanById } from "@/app/subscription-plans";
import { createRazorpayPlanIfMissing } from "@/services/razorpay";

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

  await Promise.all([
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
