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
      description="Upgrade to continue generating outputs and manage your subscription in one place."
      actions={
        <Button asChild variant="secondary" size="sm">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Subscription actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Use the actions below to manage your current plan. Billing history is available from your dashboard.</p>
          <BillingActions />
        </CardContent>
      </Card>
    </PageShell>
  );
}