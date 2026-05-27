import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingActions } from "@/components/pricing/pricing-actions";
import { requireStandardUser } from "@/lib/auth";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { getActivePlans, formatRupees, getPlanById, getPlanDisplayName, getPlanSupportText } from "@/lib/billing/plans";
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
      .select("plan_name,status")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("id,payment_amount,currency,status,plan,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const normalizedStatus = String(subscription?.status ?? "").toLowerCase();
  const hasActiveSubscription = normalizedStatus === "active";
  const activePlanId = hasActiveSubscription ? String(subscription?.plan_name ?? "").trim().toLowerCase() : null;
  const currentPlan = activePlanId ? getPlanById(activePlanId) ?? null : null;

  return (
    <WorkspaceShell title="Billing">
      <div className="space-y-8">
        <section className="premium-surface-elevated rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8 md:p-10 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primary/40"></div>
            <p className="premium-label text-xs font-bold uppercase tracking-widest text-primary">Billing & Payments</p>
          </div>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-foreground">Plans, Renewals & Payment History</h2>
          <p className="mt-3 max-w-2xl text-base font-medium leading-relaxed text-foreground/85">Your active plan, billing status, and complete transaction ledger are centralized here within our protected, enterprise-grade checkout experience.</p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-primary/20 bg-white/60 backdrop-blur px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Active Plan</p>
              <p className="mt-2 text-lg font-bold text-foreground">{currentPlan?.displayName ?? "None"}</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-white/60 backdrop-blur px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Subscription Status</p>
              <p className="mt-2 text-lg font-bold capitalize text-foreground">{normalizedStatus || "Inactive"}</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-white/60 backdrop-blur px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Total Payments</p>
              <p className="mt-2 text-lg font-bold text-foreground">{(payments ?? []).length}</p>
            </div>
          </div>
        </section>
        <section>
          <div className="mb-6 flex items-center gap-3">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary to-primary/40"></div>
            <h2 className="text-3xl font-bold text-foreground">Premium Subscription Plans</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
          {subscriptionPlans.map((plan) => {
            const active = Boolean(activePlanId) && plan.id === activePlanId;
            return (
              <Card key={plan.id} className={active ? "premium-surface relative overflow-hidden border-2 border-primary shadow-lg shadow-primary/20" : "premium-surface border border-primary/20 transition-all duration-300 hover:border-primary/50 hover:shadow-lg"}>
                {active && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/20"></div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-2xl font-bold text-foreground">{plan.displayName}</CardTitle>
                      {plan.premiumLabel ? <span className="rounded-full border-2 border-primary/40 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{plan.premiumLabel}</span> : null}
                    </div>
                    {active ? <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">● Active</span> : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-xl bg-gradient-to-br from-primary/5 to-transparent p-4 border border-primary/20">
                      <p className="text-4xl font-bold text-foreground break-words">{formatRupees(plan.monthlyPriceRupees)}<span className="text-sm font-medium text-foreground/70">/mo</span></p>
                  </div>
                  <div className="rounded-lg bg-primary/5 p-3 border border-primary/20">
                    <p className="text-sm font-bold uppercase tracking-wider text-primary">Credits Included</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{plan.credits.toLocaleString()}</p>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm font-bold leading-relaxed text-foreground">{plan.premiumPositioning}</p>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-primary/20">
                    {plan.features.map((feature) => <p key={feature} className="flex items-center gap-2 text-sm font-medium text-foreground"><span className="inline-block h-1.5 w-1.5 rounded-full bg-primary"></span> {feature}</p>)}
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground"><span className="inline-block h-1.5 w-1.5 rounded-full bg-primary"></span> {getPlanSupportText(plan.id)}</p>
                  </div>
                  <div className="pt-2">
                    <PricingActions planId={plan.id} planName={plan.displayName} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        </section>

        <Card className="premium-surface border border-primary/20 shadow-lg">
          <CardHeader className="border-b border-primary/20 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-1 w-10 rounded-full bg-gradient-to-r from-primary to-primary/40"></div>
              <CardTitle className="text-2xl font-bold text-foreground">Payment History</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-6">
            <div className="mb-5 rounded-xl border-l-4 border-primary bg-gradient-to-r from-primary/10 to-transparent p-4">
              <p className="text-sm font-bold text-foreground">Verified & Secure Transactions</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/80">Each payment is verified through Razorpay before credits and subscription access are updated, ensuring your billing history remains accurate and protected.</p>
            </div>
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b-2 border-primary/20 bg-primary/5">
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-primary">Date</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-primary">Amount</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-primary">Plan</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-primary">Status</th>
                </tr>
              </thead>
              <tbody>
                {(payments ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm font-medium text-foreground/60">No payment history yet</td>
                  </tr>
                ) : (
                  (payments ?? []).map((payment) => (
                    <tr key={payment.id} className="border-b border-primary/10 transition-colors hover:bg-primary/5">
                      <td className="px-4 py-4 text-sm font-medium text-foreground">{formatDate(payment.created_at)}</td>
                      <td className="px-4 py-4 text-sm font-bold text-foreground">{formatMoney(Number(payment.payment_amount ?? 0), payment.currency ?? "INR")}</td>
                      <td className="px-4 py-4 text-sm font-medium text-foreground">{getPlanDisplayName(payment.plan)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                          payment.status?.toLowerCase() === 'success' 
                            ? 'bg-green-500/20 text-green-600' 
                            : payment.status?.toLowerCase() === 'failed'
                            ? 'bg-red-500/20 text-red-600'
                            : 'bg-yellow-500/20 text-yellow-600'
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