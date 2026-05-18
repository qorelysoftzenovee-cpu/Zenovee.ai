import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingActions, TopupActions } from "@/components/pricing/pricing-actions";
import { subscriptionPlans } from "@/app/subscription-plans";
import { creditTopups } from "@/app/credit-topups";
import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/auth";

export default async function PricingPage() {
  const user = await getCurrentUser();
  const approxUsdByPlan: Record<string, string> = {
    starter: "~$3",
    growth: "~$9",
    scale: "~$24",
  };
  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={Boolean(user)} />
      <PageShell title="Pricing" description="Simple paid plans for serious AI workflows.">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[
            ["Secure billing", "Protected checkout and subscription verification flows."],
            ["Transparent credits", "Clear monthly usage allocations across plans."],
            ["Refund clarity", "Refund policy and support routes visible before purchase."],
            ["Upgrade confidence", "Live plan actions connected to real billing logic."],
          ].map(([title, description]) => (
            <div key={title} className="surface-muted px-4 py-4">
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {subscriptionPlans.map((plan) => (
            <Card key={plan.name} className="relative overflow-hidden hover:-translate-y-1">
              <CardHeader>
                <div className="mb-3 inline-flex w-fit rounded-full border border-accent/15 bg-accent/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                  {plan.id === "growth" ? "Most Popular" : "Paid Plan"}
                </div>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-semibold tracking-tight">
                  ₹{plan.price.toLocaleString("en-IN")}
                  <span className="text-base font-normal text-muted-foreground">/month</span>
                </p>
                <p className="text-sm text-muted-foreground">({approxUsdByPlan[plan.id]})</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {plan.credits.toLocaleString()} monthly credits</li>
                  {plan.features.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
                <PricingActions
                  planId={plan.id}
                  planName={plan.id === "starter" ? "Starter" : plan.id === "growth" ? "Growth" : "Scale"}
                />
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          International cards are supported. Charges are processed securely in INR.
        </p>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Credit Topups</h2>
          <p className="mt-2 text-sm text-muted-foreground">Buy additional credits instantly. Secure payments via Razorpay over SSL. Charges are processed in INR.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {creditTopups.map((topup) => (
              <Card key={topup.id} className="surface-card">
                <CardHeader>
                  <CardTitle>{topup.credits} Credits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-2xl font-semibold tracking-tight">₹{topup.priceInr.toLocaleString("en-IN")}</p>
                  <TopupActions topupId={topup.id} label={`${topup.credits} credits`} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="surface-card mt-8 p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <a href="/privacy" className="text-sm font-medium text-foreground transition-colors hover:text-accent">Privacy Policy</a>
            <a href="/terms" className="text-sm font-medium text-foreground transition-colors hover:text-accent">Terms of Service</a>
            <a href="/refund" className="text-sm font-medium text-foreground transition-colors hover:text-accent">Refund Policy</a>
            <a href="mailto:support@yourdomain.com" className="text-sm font-medium text-foreground transition-colors hover:text-accent">Contact support</a>
          </div>
        </div>
      </PageShell>
      <Footer />
    </div>
  );
}
