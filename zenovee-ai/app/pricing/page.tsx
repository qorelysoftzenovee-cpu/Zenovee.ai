import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingActions } from "@/components/pricing/pricing-actions";
import { subscriptionPlans } from "@/app/subscription-plans";
import Navigation from "@/app/components/Navigation";
import { Footer } from "@/components/layout/footer";
import { getCurrentUser } from "@/lib/auth";
import { SUPPORT_EMAIL } from "@/lib/seo/site";

export default async function PricingPage() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={Boolean(user)} isAdmin={user?.role === "admin"} />
      <PageShell title="Pricing" description="Simple paid plans. No distractions.">
        <div className="mb-6 max-w-2xl space-y-2">
          <p className="text-sm text-muted-foreground">Choose a plan, open your workspace, and start generating your first AI asset.</p>
          <p className="text-sm text-muted-foreground">Secure payments via Razorpay.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {subscriptionPlans.map((plan) => (
            <Card key={plan.name} className="border-border bg-card">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-semibold tracking-tight">
                  ₹{plan.price.toLocaleString("en-IN")}
                  <span className="text-base font-normal text-muted-foreground">/month</span>
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• {plan.credits.toLocaleString()} monthly credits</li>
                  {plan.features.slice(0, 3).map((point) => (
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
        <p className="mt-5 text-sm text-muted-foreground">
          Charges are processed in INR. For billing questions, email {SUPPORT_EMAIL}.
        </p>
      </PageShell>
      <Footer />
    </div>
  );
}
