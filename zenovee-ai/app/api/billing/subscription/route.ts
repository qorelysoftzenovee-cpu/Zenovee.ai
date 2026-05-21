import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlanById } from "@/app/subscription-plans";
import { getRazorpayClient } from "@/services/razorpay";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseAdmin = getSupabaseAdmin();
  const [{ data: subscription }, { data: payments }] = await Promise.all([
    supabaseAdmin
      .from("subscriptions")
      .select("plan_name,status,current_period_end,next_renewal_at,grace_until,cancel_at_period_end,razorpay_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("payments")
      .select("id,payment_amount,currency,status,razorpay_transaction_id,created_at,failure_reason,plan")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({ subscription, payments: payments ?? [] });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { action?: "cancel" | "upgrade"; planId?: string };
  const supabaseAdmin = getSupabaseAdmin();

  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("razorpay_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle<{ razorpay_subscription_id: string | null }>();

  if (!sub?.razorpay_subscription_id) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  if (body.action === "cancel") {
    await getRazorpayClient().subscriptions.cancel(sub.razorpay_subscription_id, true);
    await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() } as never)
      .eq("user_id", user.id);
    return NextResponse.json({ success: true });
  }

  if (body.action === "upgrade") {
    const plan = body.planId ? getPlanById(body.planId) : undefined;
    if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    await supabaseAdmin
      .from("subscriptions")
      .update({ pending_plan_id: plan.id, updated_at: new Date().toISOString() } as never)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, message: "Upgrade scheduled for next cycle" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
