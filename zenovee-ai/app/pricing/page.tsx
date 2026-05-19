import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingActions, TopupActions } from "@/components/pricing/pricing-actions";
import { subscriptionPlans } from "@/app/subscription-plans";
import { creditTopups } from "@/app/credit-topups";
import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/auth";
import { SUPPORT_EMAIL } from "@/lib/seo/site";

export default async function PricingPage() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={Boolean(user)} isAdmin={user?.role === "admin"} />
      <PageShell title="Pricing" description="Simple paid plans for focused AI workflows.">
        <div className="grid gap-5 md:grid-cols-3">
          {subscriptionPlans.map((plan) => (
            <Card key={plan.name} className="relative overflow-hidden border-white/10 hover:-translate-y-1">
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
          Charges are processed in INR. For billing questions, email {SUPPORT_EMAIL}.
        </p>

        <div className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Credit Topups</h2>
          <p className="mt-2 text-sm text-muted-foreground">Buy additional credits instantly. Secure payments via Razorpay over SSL. Charges are processed in INR.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {creditTopups.map((topup) => (
              <Card key={topup.id} className="surface-card border-white/10">
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
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm font-medium text-foreground transition-colors hover:text-accent">Contact support</a>
          </div>
        </div>
      </PageShell>
      <Footer />
    </div>
  );
}
