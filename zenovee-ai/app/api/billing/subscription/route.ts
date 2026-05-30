import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlanById } from "@/lib/billing/plans";
import { normalizeSubscriptionState } from "@/lib/billing/subscription-state";
import { getRazorpayClient } from "@/lib/razorpay/client";

const subscriptionActionSchema = z.object({
  action: z.enum(["cancel", "upgrade"]),
  planId: z.string().min(1).optional(),
});

function jsonError(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();
  const [{ data: subscription }, { data: payments }] = await Promise.all([
    supabaseAdmin
      .from("subscriptions")
      .select("plan_id,plan_name,status,current_period_end,next_renewal_at,grace_until,cancel_at_period_end,razorpay_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("payments")
      .select("id,payment_amount,currency,status,razorpay_transaction_id,created_at,failure_reason,plan")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({
    subscription: normalizeSubscriptionState(subscription),
    payments: payments ?? [],
  });
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Unauthorized", 401, "AUTH_REQUIRED");

    const body = subscriptionActionSchema.parse(await request.json());
    const supabaseAdmin = getSupabaseAdmin();

    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("status,plan_id,plan_name,razorpay_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle<{ status: string; plan_id?: string | null; plan_name?: string | null; razorpay_subscription_id: string | null }>();

    if (!sub || !["ACTIVE", "PAST_DUE", "PENDING"].includes(sub.status)) {
      return jsonError("No active subscription", 404, "SUBSCRIPTION_NOT_FOUND");
    }

    if (body.action === "cancel") {
      if (sub.razorpay_subscription_id) {
        await getRazorpayClient().subscriptions.cancel(sub.razorpay_subscription_id, true);
      }

      await supabaseAdmin
        .from("subscriptions")
        .update({ cancel_at_period_end: true, status: "CANCELLED", updated_at: new Date().toISOString() } as never)
        .eq("user_id", user.id);
      return NextResponse.json({ success: true, message: "Subscription cancellation scheduled." });
    }

    if (body.action === "upgrade") {
      const plan = body.planId ? getPlanById(body.planId) : undefined;
      if (!plan || !plan.active) return jsonError("Invalid plan", 400, "INVALID_PLAN");
      if (plan.id === (sub.plan_id ?? sub.plan_name)) return jsonError("You are already on this plan", 409, "PLAN_UNCHANGED");

      await supabaseAdmin
        .from("subscriptions")
        .update({ pending_plan_id: plan.id, updated_at: new Date().toISOString() } as never)
        .eq("user_id", user.id);

      return NextResponse.json({ success: true, message: "Plan change scheduled for next cycle." });
    }

    return jsonError("Invalid action", 400, "INVALID_ACTION");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Invalid request", 400, "INVALID_SUBSCRIPTION_ACTION");
    }

    return jsonError("Unable to update subscription right now", 500, "SUBSCRIPTION_UPDATE_FAILED");
  }
}
