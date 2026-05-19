import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getAdminOverviewData } from "@/lib/admin";

export default async function AdminSubscriptionsPage() {
  await requireAdmin();
  const data = await getAdminOverviewData();

  return (
    <PageShell title="Subscriptions" description="Track active plans, renewals, cancellations, and subscription health across the platform." variant="admin" className="bg-transparent">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-white/[0.04] text-white"><CardHeader><CardTitle>Active Subscriptions</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{data.totals.activeSubscriptions}</p></CardContent></Card>
        <Card className="border-white/10 bg-white/[0.04] text-white"><CardHeader><CardTitle>Total Users</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{data.totals.totalUsers}</p></CardContent></Card>
        <Card className="border-white/10 bg-white/[0.04] text-white"><CardHeader><CardTitle>Failed Payments</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{data.totals.failedPayments}</p></CardContent></Card>
      </div>

      <Card className="mt-6 border-white/10 bg-white/[0.04] text-white">
        <CardHeader><CardTitle>Recent Subscription Activity</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.recentSubscriptions.map((subscription) => (
            <div key={subscription.id} className="surface-muted flex flex-col gap-3 px-4 py-4 text-sm md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-white">{subscription.user?.name ?? subscription.user?.email ?? subscription.user_id}</p>
                <p className="text-xs text-slate-400">{subscription.plan_name} • {subscription.status}</p>
              </div>
              <div className="text-right text-xs text-slate-300">
                <p>Renewal: {subscription.next_renewal_at ? new Date(subscription.next_renewal_at).toLocaleDateString() : "N/A"}</p>
                <p>{subscription.cancel_at_period_end ? "Cancels at period end" : "Auto-renews"}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}