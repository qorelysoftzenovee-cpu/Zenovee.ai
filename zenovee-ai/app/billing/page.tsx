import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingActions } from "@/components/billing/billing-actions";
import { PricingActions, TopupActions } from "@/components/pricing/pricing-actions";
import { requireStandardUser } from "@/lib/auth";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { subscriptionPlans } from "@/app/subscription-plans";
import { creditTopups } from "@/app/credit-topups";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function formatMoney(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
}

function paymentStatusBadge(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "SUCCESS" || normalized === "CREDIT_TOPUP") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  }
  if (normalized === "FAILED") {
    return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
  }
  if (normalized === "CANCELLED") {
    return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
  }
  return "bg-muted text-muted-foreground border-border";
}

export default async function BillingPage() {
  const user = await requireStandardUser();
  const supabase = await createSupabaseServerClient();

  const [{ data: subscription }, { data: payments }, { data: latestUsage }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan_name,status,current_period_end,next_renewal_at,cancel_at_period_end")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("id,payment_amount,currency,status,plan,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("credits")
      .select("remaining_balance")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const currentPlan = subscriptionPlans.find((plan) => plan.id === subscription?.plan_name) ?? subscriptionPlans[0];
  const remainingCredits = Number(latestUsage?.remaining_balance ?? 0);
  const usagePercent = Math.min(100, Math.max(0, Math.round(((currentPlan.credits - remainingCredits) / currentPlan.credits) * 100)));

  return (
    <WorkspaceShell title="Billing" subtitle="Subscription, usage, and payment records">
      <div className="space-y-6">
        <section className="surface-card p-5 md:p-6">
          <div>
            <p className="premium-label">Billing Center</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Plans, credits, and invoices</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage subscription, buy credits, and review every transaction in one place.</p>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div><p className="text-xs text-muted-foreground">Plan</p><p className="text-base font-semibold">{currentPlan.name}</p></div>
              <div><p className="text-xs text-muted-foreground">Credits remaining</p><p className="text-base font-semibold">{remainingCredits}</p></div>
              <div><p className="text-xs text-muted-foreground">Renewal date</p><p className="text-base font-semibold">{formatDate(subscription?.next_renewal_at ?? subscription?.current_period_end)}</p></div>
              <div><p className="text-xs text-muted-foreground">Status</p><p className="text-base font-semibold uppercase">{subscription?.cancel_at_period_end ? "Cancels at period end" : subscription?.status ?? "Active"}</p></div>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Usage this cycle</span><span>{usagePercent}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${usagePercent}%` }} /></div>
            </div>
            <BillingActions />
          </CardContent>
        </Card>

        <section className="grid gap-4 lg:grid-cols-3">
          {subscriptionPlans.map((plan) => {
            const recommended = plan.id === "growth";
            return (
              <Card key={plan.id} className={recommended ? "border-primary/50" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {recommended ? <span className="premium-label">Recommended</span> : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-2xl font-semibold">₹{plan.price}<span className="text-sm text-muted-foreground">/month</span></p>
                  <p className="text-sm text-muted-foreground">{plan.credits} credits included</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {plan.features.map((feature) => <li key={feature}>• {feature}</li>)}
                    <li>• {plan.id === "scale" ? "Priority support" : plan.id === "growth" ? "Business-hours support" : "Email support"}</li>
                  </ul>
                  <PricingActions planId={plan.id} planName={plan.name} amount={plan.price} currency={plan.currency} credits={plan.credits} />
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card>
          <CardHeader><CardTitle>Credit Top-Ups</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {creditTopups.map((topup) => (
              <div key={topup.id} className="rounded-2xl border border-border/70 p-4">
                <p className="text-base font-semibold">Buy {topup.credits} credits</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatMoney(topup.priceInr)}</p>
                <div className="mt-4"><TopupActions topupId={topup.id} label={`${topup.credits} credits`} /></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="pb-3">Date</th><th className="pb-3">Amount</th><th className="pb-3">Plan</th><th className="pb-3">Status</th><th className="pb-3">Invoice</th></tr>
              </thead>
              <tbody>
                {(payments ?? []).map((payment) => (
                  <tr key={payment.id} className="border-t border-border/60">
                    <td className="py-3">{formatDate(payment.created_at)}</td>
                    <td className="py-3">{formatMoney(Number(payment.payment_amount ?? 0), payment.currency ?? "INR")}</td>
                    <td className="py-3">{payment.plan}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${paymentStatusBadge(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">Available in Razorpay records</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Billing support</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            For invoice corrections, payment verification delays, or subscription changes, contact support with your payment ID and account email.
          </CardContent>
        </Card>
      </div>
    </WorkspaceShell>
  );
}