import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getAdminOverviewData } from "@/lib/admin";

function formatInr(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const data = await getAdminOverviewData();

  return (
    <PageShell title="Analytics" description="API economics, request trends, tool performance, and operational telemetry." variant="admin" className="bg-transparent">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="admin-surface"><CardHeader><CardTitle>Total Requests</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.totals.totalApiRequests}</p></CardContent></Card>
        <Card className="admin-surface"><CardHeader><CardTitle>Total Tokens</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.totals.totalTokens.toLocaleString()}</p></CardContent></Card>
        <Card className="admin-surface"><CardHeader><CardTitle>Estimated API Cost</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{formatInr(data.totals.totalApiCost)}</p></CardContent></Card>
        <Card className="admin-surface"><CardHeader><CardTitle>Failed API Requests</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.totals.apiFailures}</p></CardContent></Card>
        <Card className="admin-surface"><CardHeader><CardTitle>Refund Events</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{data.totals.refunds}</p></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="admin-surface">
          <CardHeader><CardTitle>Recent API Usage</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.recentApiUsage.length ? data.recentApiUsage.map((row) => (
              <div key={row.id} className="admin-row flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-white">{row.provider} • {row.model}</p>
                  <p className="text-xs text-slate-400">{row.user?.email ?? row.user_id} • {new Date(row.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right text-xs text-slate-300">
                  <p>{Number(row.total_tokens).toLocaleString()} tokens</p>
                  <p>{formatInr(Number(row.estimated_cost))}</p>
                  <p>{row.status}</p>
                </div>
              </div>
            )) : <div className="admin-row text-sm text-slate-400">No API activity yet.</div>}
          </CardContent>
        </Card>

        <Card className="admin-surface">
          <CardHeader><CardTitle>Tool Performance Snapshot</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.toolsAnalytics.length ? data.toolsAnalytics.slice(0, 10).map((tool) => (
              <div key={tool.tool} className="admin-row text-sm">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-white">{tool.tool}</p>
                  <p>{tool.usageCount} runs</p>
                </div>
                <div className="mt-2 grid gap-2 text-xs text-slate-300 md:grid-cols-4">
                  <span>Credits: {tool.creditConsumption}</span>
                  <span>API Cost: {formatInr(tool.apiCostEstimate)}</span>
                  <span>Latency: {tool.averageResponseMs} ms</span>
                  <span>Failure: {tool.failureRate}%</span>
                </div>
              </div>
            )) : <div className="admin-row text-sm text-slate-400">No tool performance data yet.</div>}
          </CardContent>
        </Card>

        <Card className="admin-surface">
          <CardHeader><CardTitle>Workspace Performance Snapshot</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.workspaceAnalytics?.length ? data.workspaceAnalytics.slice(0, 10).map((workspace) => (
              <div key={workspace.workspaceId} className="admin-row text-sm">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-white">{workspace.workspaceId}</p>
                  <p>{workspace.runs} runs</p>
                </div>
                <div className="mt-2 grid gap-2 text-xs text-slate-300 md:grid-cols-3">
                  <span>Credits: {workspace.credits}</span>
                  <span>Failures: {workspace.failures}</span>
                  <span>Failure Rate: {workspace.failureRate}%</span>
                </div>
              </div>
            )) : <div className="admin-row text-sm text-slate-400">No workspace telemetry yet.</div>}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}