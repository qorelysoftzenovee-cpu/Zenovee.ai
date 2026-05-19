import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getAdminOverviewData } from "@/lib/admin";

function formatInr(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default async function AdminPage() {
  const adminUser = await requireAdmin();
  const data = await getAdminOverviewData();

  const metrics: Array<{ label: string; value: string | number }> = [
    { label: "Total Revenue", value: formatInr(data.totals.totalRevenue) },
    { label: "MRR", value: formatInr(data.totals.mrr) },
    { label: "Total Users", value: data.totals.totalUsers },
    { label: "Active Subscriptions", value: data.totals.activeSubscriptions },
    { label: "Failed Payments", value: data.totals.failedPayments },
    { label: "Refund Count", value: data.totals.refundCount },
    { label: "Credits Consumed", value: data.totals.creditsConsumed },
    { label: "Credits Remaining", value: data.totals.creditsRemaining },
    { label: "API Cost Estimate", value: formatInr(data.totals.apiCost) },
    { label: "Estimated Profit", value: formatInr(data.totals.estimatedProfit) },
    { label: "Subscription Conversion", value: `${data.totals.conversionRate}%` },
    { label: "Abuse Flags (7d)", value: data.totals.abuseDetectedLast7d },
  ];

  return (
    <PageShell
      title="SaaS Operations Dashboard"
      description="Production admin visibility across revenue, users, subscriptions, payments, usage, and API economics."
      variant="admin"
    >
      <p className="mb-6 text-xs text-muted-foreground">Server-verified admin session: {adminUser.email}</p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="animate-enter">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most Used Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.mostUsedTools.length === 0 ? (
              <div className="surface-muted px-4 py-4 text-sm text-muted-foreground">No tool usage yet.</div>
            ) : (
              data.mostUsedTools.map((tool) => (
                <div key={tool.tool} className="surface-muted flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium">{tool.tool}</span>
                  <span>{tool.usageCount} runs</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Highest Consuming Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.highestConsumingUsers.length === 0 ? (
              <div className="surface-muted px-4 py-4 text-sm text-muted-foreground">No user usage data yet.</div>
            ) : (
              data.highestConsumingUsers.map(([userId, credits]) => (
                <div key={userId} className="surface-muted flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="truncate font-medium">{userId}</span>
                  <span>{credits} credits</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>API Usage Spikes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.usageSpikes.length === 0 ? (
              <div className="surface-muted px-4 py-4 text-sm text-muted-foreground">No usage spikes detected.</div>
            ) : (
              data.usageSpikes.map((spike) => (
                <div key={spike.day} className="surface-muted flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium">{spike.day}</span>
                  <span>{spike.requests} requests</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
