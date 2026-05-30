import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingActions } from "@/components/pricing/pricing-actions";
import { requireStandardUser } from "@/lib/auth";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { getActivePlans, formatRupees, getPlanDisplayName, getPlanSupportText } from "@/lib/billing/plans";
import { getSubscriptionPlanRecord, normalizeSubscriptionState } from "@/lib/billing/subscription-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

function formatMoney(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
}

export default async function BillingPage() {
  const user = await requireStandardUser();
  const supabase = await createSupabaseServerClient();
  const subscriptionPlans = getActivePlans();

  const [{ data: subscription }, { data: payments }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan_id,plan_name,status,current_period_end,next_renewal_at,grace_until,cancel_at_period_end,razorpay_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("id,payment_amount,currency,status,plan,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const subscriptionState = normalizeSubscriptionState(subscription);
  const normalizedStatus = subscriptionState.normalizedStatus;
  const latestSuccessfulPaymentPlan = (payments ?? []).find((payment) => payment.status?.toLowerCase() === "success")?.plan ?? null;
  const activePlanId = subscriptionState.planId ?? latestSuccessfulPaymentPlan;
  const currentPlan = getSubscriptionPlanRecord(subscription);
  const paymentRows = payments ?? [];
  const successfulPayments = paymentRows.filter((payment) => payment.status?.toLowerCase() === "success").length;
  const statusToneClass =
    normalizedStatus === "active"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : normalizedStatus === "cancelled"
      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
      : "bg-muted text-muted-foreground";

  return (
    <WorkspaceShell title="Billing">
      <div className="space-y-8">
        <section className="rounded-3xl border border-border/70 bg-gradient-to-br from-background via-background to-primary/5 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Billing Overview</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Manage plans and payments</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Review your current subscription, choose the right plan, and track all payment activity in one place.
              </p>
            </div>
            <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusToneClass}`}>
              {(normalizedStatus || "inactive").replace("_", " ")}
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current Plan</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{currentPlan?.displayName ?? getPlanDisplayName(activePlanId) ?? subscriptionState.planName ?? "No active plan"}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Plan Status</p>
              <p className="mt-1 text-lg font-semibold capitalize text-foreground">{normalizedStatus}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payments Logged</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{paymentRows.length}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Successful Payments</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{successfulPayments}</p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-foreground md:text-3xl">Subscription plans</h2>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Secure checkout via Razorpay</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
          {subscriptionPlans.map((plan) => {
            const active = Boolean(activePlanId) && plan.id === activePlanId;
            return (
              <Card
                key={plan.id}
                className={
                  active
                    ? "relative overflow-hidden border-2 border-primary/70 bg-gradient-to-b from-primary/5 to-card"
                    : "border border-border/80 bg-card transition-all duration-200 hover:border-primary/40"
                }
              >
                {active && (
                  <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/20"></div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-2xl font-semibold text-foreground">{plan.displayName}</CardTitle>
                      {plan.premiumLabel ? <span className="mt-2 inline-flex rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{plan.premiumLabel}</span> : null}
                    </div>
                    {active ? <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Active</span> : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                      <p className="break-words text-4xl font-semibold text-foreground">{formatRupees(plan.monthlyPriceRupees)}<span className="text-sm font-medium text-foreground/70">/mo</span></p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Credits included</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{plan.credits.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{plan.premiumPositioning}</p>
                  </div>
                  <div className="space-y-2 border-t border-border/70 pt-3">
                    {plan.features.map((feature) => <p key={feature} className="flex items-start gap-2 text-sm text-foreground"><span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></span> {feature}</p>)}
                    <p className="flex items-start gap-2 text-sm text-foreground"><span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></span> {getPlanSupportText(plan.id)}</p>
                  </div>
                  <div className="pt-1">
                    <PricingActions planId={plan.id} planName={plan.displayName} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        </section>

        <Card className="border border-border/70 bg-card">
          <CardHeader className="border-b border-border/70 pb-6">
            <div className="flex items-center gap-3">
              <CardTitle className="text-2xl font-semibold text-foreground">Payment history</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Each transaction is verified before subscription access and credits are updated.</p>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-6">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border/70 bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No payment history yet</td>
                  </tr>
                ) : (
                  paymentRows.map((payment) => (
                    <tr key={payment.id} className="border-b border-border/50 transition-colors hover:bg-muted/20">
                      <td className="px-4 py-4 text-sm text-foreground">{formatDate(payment.created_at)}</td>
                      <td className="px-4 py-4 text-sm font-medium text-foreground">{formatMoney(Number(payment.payment_amount ?? 0), payment.currency ?? "INR")}</td>
                      <td className="px-4 py-4 text-sm text-foreground">{getPlanDisplayName(payment.plan)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                          payment.status?.toLowerCase() === 'success' 
                            ? 'bg-green-500/20 text-green-700 dark:text-green-300' 
                            : payment.status?.toLowerCase() === 'failed'
                            ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                            : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

      </div>
    </WorkspaceShell>
  );
}