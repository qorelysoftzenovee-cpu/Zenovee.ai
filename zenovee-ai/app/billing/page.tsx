import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BillingActions } from "@/components/billing/billing-actions";
import { requireStandardUser } from "@/lib/auth";

export default async function BillingPage() {
  await requireStandardUser();

  return (
    <div className="space-y-6">
      <section className="surface-card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="premium-label">Billing</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Subscription & payments</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage plan changes with clear billing terms and trusted Razorpay processing.</p>
          </div>
          <Button asChild variant="secondary" size="sm"><Link href="/dashboard">Back to dashboard</Link></Button>
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Subscription actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Use these actions to manage your current plan. Your payment history stays available on the dashboard.</p>
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
    </div>
  );
}