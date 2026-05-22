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
    { label: "Active Subscriptions", value: data.totals.activeSubscriptions },
    { label: "Failed Payments", value: data.totals.failedPayments },
    { label: "Tool Runs", value: data.totals.successfulExecutions },
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
      <p className="mb-6 text-xs text-slate-600">Server-verified admin session: {adminUser.email}</p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} className="admin-surface">
            <CardHeader>
              <CardTitle className="text-sm text-slate-600">{metric.label}</CardTitle>
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
            <Card key={chart.title} className="admin-surface">
              <CardHeader>
                <CardTitle>{chart.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {chart.items.map((item) => (
                  <div key={item.key} className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
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
        <Card className="admin-surface">
          <CardHeader>
            <CardTitle>Most Used Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.mostUsedTools.length === 0 ? (
              <div className="admin-row text-sm text-slate-600">No tool usage yet.</div>
            ) : (
              data.mostUsedTools.map((tool) => (
                <div key={tool.tool} className="admin-row space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-slate-900">{tool.tool}</span>
                    <span>{tool.usageCount} runs</span>
                  </div>
                  <div className="grid gap-2 text-xs text-slate-600 md:grid-cols-4">
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

        <Card className="admin-surface">
          <CardHeader>
            <CardTitle>Top users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topUsers.length === 0 ? (
              <div className="admin-row text-sm text-slate-600">No user usage data yet.</div>
            ) : (
              data.topUsers.map((user) => (
                <div key={user.userId} className="admin-row flex items-center justify-between gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{user.name ?? user.email}</p>
                    <p className="truncate text-xs text-slate-600">{user.email}</p>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <p>{user.totalRuns} runs</p>
                    <p>{user.totalCredits} credits</p>
                    <p>{formatInr(user.totalSpend)}</p>
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
