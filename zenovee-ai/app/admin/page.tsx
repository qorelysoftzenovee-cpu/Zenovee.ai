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
    { label: "30-Day Revenue", value: formatInr(data.totals.monthlyRevenue) },
    { label: "Total Users", value: data.totals.totalUsers },
    { label: "Admin Users", value: data.totals.adminUsers },
    { label: "Active Subscriptions", value: data.totals.activeSubscriptions },
    { label: "Failed Payments", value: data.totals.failedPayments },
    { label: "Refund Count", value: data.totals.refundCount },
    { label: "Tool Runs", value: data.totals.successfulExecutions },
    { label: "Failed Runs", value: data.totals.failedExecutions },
    { label: "Credits Consumed", value: data.totals.creditsConsumed },
    { label: "Credits Remaining", value: data.totals.creditsRemaining },
    { label: "API Requests", value: data.totals.totalApiRequests },
    { label: "API Cost", value: formatInr(data.totals.totalApiCost) },
  ];

  const charts = [
    { title: "User growth", items: data.charts.userGrowth, accent: "from-violet-500 to-fuchsia-400" },
    { title: "Revenue trend", items: data.charts.revenue, accent: "from-emerald-500 to-teal-400", formatter: formatInr },
    { title: "API request volume", items: data.charts.apiRequests, accent: "from-sky-500 to-cyan-400" },
  ];

  return (
    <PageShell
      title="Admin operations dashboard"
      description="Production visibility for revenue, subscriptions, user activity, API usage, and billing health."
      variant="admin"
      className="bg-transparent"
    >
      <p className="mb-6 text-xs text-slate-400">Server-verified admin session: {adminUser.email}</p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="text-sm text-slate-400">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {charts.map((chart) => {
          const maxValue = Math.max(...chart.items.map((item) => item.value), 1);

          return (
            <Card key={chart.title} className="border-white/10 bg-white/[0.04] text-white">
              <CardHeader>
                <CardTitle>{chart.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {chart.items.map((item) => (
                  <div key={item.key} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>{item.label}</span>
                      <span>{chart.formatter ? chart.formatter(item.value) : item.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full rounded-full bg-gradient-to-r ${chart.accent}`} style={{ width: `${Math.max(8, (item.value / maxValue) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>Most Used Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.mostUsedTools.length === 0 ? (
              <div className="surface-muted px-4 py-4 text-sm text-slate-400">No tool usage yet.</div>
            ) : (
              data.mostUsedTools.map((tool) => (
                <div key={tool.tool} className="surface-muted space-y-3 px-4 py-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-white">{tool.tool}</span>
                    <span>{tool.usageCount} runs</span>
                  </div>
                  <div className="grid gap-2 text-xs text-slate-300 md:grid-cols-4">
                    <span>Credits: {tool.creditConsumption}</span>
                    <span>API Cost: {formatInr(tool.apiCostEstimate)}</span>
                    <span>Latency: {tool.averageResponseMs} ms</span>
                    <span>Failure: {tool.failureRate}%</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle>Top users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topUsers.length === 0 ? (
              <div className="surface-muted px-4 py-4 text-sm text-slate-400">No user usage data yet.</div>
            ) : (
              data.topUsers.map((user) => (
                <div key={user.userId} className="surface-muted flex items-center justify-between gap-4 px-4 py-4 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{user.name ?? user.email}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>
                  <div className="text-right text-xs text-slate-300">
                    <p>{user.totalRuns} runs</p>
                    <p>{user.totalCredits} credits</p>
                    <p>{formatInr(user.totalSpend)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.04] text-white xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentPayments.length === 0 ? (
              <div className="surface-muted px-4 py-4 text-sm text-slate-400">No recent payments.</div>
            ) : (
              data.recentPayments.map((payment) => (
                <div key={payment.id} className="surface-muted flex flex-col gap-3 px-4 py-4 text-sm md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-white">{payment.user?.name ?? payment.user?.email ?? payment.user_id}</p>
                    <p className="text-xs text-slate-400">{payment.plan} • {payment.status} • {new Date(payment.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{formatInr(payment.payment_amount)}</p>
                    {payment.failure_reason ? <p className="text-xs text-rose-300">{payment.failure_reason}</p> : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
