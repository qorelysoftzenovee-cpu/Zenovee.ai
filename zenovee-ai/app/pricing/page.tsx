import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingActions } from "@/components/pricing/pricing-actions";
import { subscriptionPlans } from "@/app/subscription-plans";

export default function PricingPage() {
  return (
    <PageShell
      title="Pricing"
      description="Transparent plans with live checkout wiring and tracked credit allocations."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {subscriptionPlans.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-3xl font-semibold tracking-tight">
                ₹{plan.price}
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• {plan.credits.toLocaleString()} monthly credits</li>
                {plan.features.map((point) => (
                  <li key={point}>• {point}</li>
                ))}
              </ul>
              <PricingActions planId={plan.id} planName={plan.name} />
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
