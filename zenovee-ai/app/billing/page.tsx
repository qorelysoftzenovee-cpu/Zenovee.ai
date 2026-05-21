import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BillingActions } from "@/components/billing/billing-actions";
import { requireStandardUser } from "@/lib/auth";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export default async function BillingPage() {
  await requireStandardUser();

  return (
    <WorkspaceShell title="Billing" subtitle="Subscription, usage, and payment records">
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
            <CardTitle>Current plan & subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Review active status, renewal cycle, and manage upgrades or cancellation with clear billing controls.</p>
            <BillingActions />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment history & invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Secure payments via Razorpay.</p>
            <p>Invoices and transaction records are retained for finance and compliance visibility.</p>
            <p>Usage summary and credit top-ups are linked to your active workspace cycle.</p>
          </CardContent>
        </Card>
      </div>
    </div>
    </WorkspaceShell>
  );
}