import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function BillingPage() {
  const user = await requireStandardUser();
  const supabase = await createSupabaseServerClient();

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

  const currentPlan = subscriptionPlans.find((plan) => plan.id === subscription?.plan_name) ?? subscriptionPlans[0];

  return (
    <WorkspaceShell title="Billing">
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Subscription Plans</h2>
          <div className="grid gap-4 lg:grid-cols-3">
          {subscriptionPlans.map((plan) => {
            const active = plan.id === currentPlan.id;
            return (
              <Card key={plan.id} className={active ? "border-slate-900" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {active ? <span className="text-xs font-semibold text-slate-500">Current</span> : null}
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
          </div>
        </section>

        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr><th className="pb-3">Date</th><th className="pb-3">Amount</th><th className="pb-3">Plan</th><th className="pb-3">Status</th></tr>
              </thead>
              <tbody>
                {(payments ?? []).map((payment) => (
                  <tr key={payment.id} className="border-t border-border/60">
                    <td className="py-3">{formatDate(payment.created_at)}</td>
                    <td className="py-3">{formatMoney(Number(payment.payment_amount ?? 0), payment.currency ?? "INR")}</td>
                    <td className="py-3">{payment.plan}</td>
                    <td className="py-3">{payment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Credit Topups</CardTitle></CardHeader>
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
      </div>
    </WorkspaceShell>
  );
}