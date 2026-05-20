import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BillingActions } from "@/components/billing/billing-actions";
import { requireStandardUser } from "@/lib/auth";

export default async function BillingPage() {
  await requireStandardUser();

  return (
    <PageShell
      title="Billing"
      description="Review subscription actions, payment trust details, and renewal updates in one place."
      actions={
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Subscription actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Use the actions below to manage your current plan. Billing history remains available from your dashboard.</p>
            <BillingActions />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing confidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Secure payments via Razorpay.</p>
            <p>Your subscription updates automatically after payment.</p>
            <p>If you cancel, your current period stays active until the scheduled end date.</p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}