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
      <main className="section-shell py-12 md:py-16">
        <div className="mb-8 surface-card content-rhythm p-6 md:p-8">
          <p className="premium-label">Pricing</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-[2.5rem]">Simple plans with clear monthly credits</h1>
          <p className="max-w-2xl text-[0.95rem] text-muted-foreground">All plans are billed monthly in INR. Payments are processed securely by Razorpay, and your subscription status updates automatically after successful payment.</p>
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
          Charges are processed in INR. Need help with billing? Email {SUPPORT_EMAIL}.
        </p>
      </main>
      <Footer />
    </div>
  );
}
