import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getAdminOverviewData } from "@/lib/admin";

export default async function AdminToolsPage() {
  await requireAdmin();
  const data = await getAdminOverviewData();

  return (
    <PageShell title="Tools Analytics" description="Usage, cost, latency, failures, and most active users by tool." variant="admin">
      <Card>
        <CardHeader><CardTitle>Per Tool Analytics</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.toolsAnalytics.map((t) => (
            <div key={t.tool} className="surface-muted p-4 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{t.tool}</p>
                <p>{t.usageCount} runs</p>
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <p>API cost: ₹{t.apiCostEstimate.toFixed(2)}</p>
                <p>Avg response: {t.averageResponseMs} ms</p>
                <p>Credits: {t.creditConsumption}</p>
                <p>Failure rate: {t.failureRate}%</p>
                <p>Revenue/tool: ₹{Number(t.revenueGenerated).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
