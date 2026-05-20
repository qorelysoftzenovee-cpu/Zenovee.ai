import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getAdminOverviewData } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { listToolDefinitions } from "@/definitions";
import { ToolPricingManager } from "@/components/admin/tool-pricing-manager";

type ToolPricingRow = {
  tool_id: string;
  credits_cost: number;
  is_active: boolean;
  cooldown_seconds: number;
  metadata: Record<string, unknown> | null;
};

export default async function AdminToolsPage() {
  await requireAdmin();
  const data = await getAdminOverviewData();
  const supabase = getSupabaseAdmin();
  const definitions = listToolDefinitions();
  const { data: pricingRows } = await supabase
    .from("tool_pricing")
    .select("tool_id,credits_cost,is_active,cooldown_seconds,metadata")
    .order("tool_id", { ascending: true });

  const pricingMap = new Map(((pricingRows ?? []) as ToolPricingRow[]).map((row) => [row.tool_id, row]));
  const pricingItems = definitions.map((tool) => {
    const row = pricingMap.get(tool.id);
    return {
      toolId: tool.id,
      toolName: tool.metadata.name,
      category: tool.metadata.category,
      creditsCost: Number(row?.credits_cost ?? tool.creditCost),
      isActive: row?.is_active ?? tool.metadata.availability !== "coming_soon",
      cooldownSeconds: Number(row?.cooldown_seconds ?? 0),
      metadata: row?.metadata ?? null,
    };
  });

  return (
    <PageShell title="Tools" description="Pricing controls, usage trends, cost analytics, and per-tool performance monitoring." variant="admin" className="bg-transparent">
      <Card className="mb-6 admin-surface">
        <CardHeader><CardTitle>Tool Pricing Management</CardTitle></CardHeader>
        <CardContent>
          <ToolPricingManager items={pricingItems} />
        </CardContent>
      </Card>

      <Card className="admin-surface">
        <CardHeader><CardTitle>Per Tool Analytics</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.toolsAnalytics.map((t) => (
            <div key={t.tool} className="admin-row text-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{t.tool}</p>
                <p>{t.usageCount} runs</p>
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                <p>API cost: ₹{t.apiCostEstimate.toFixed(2)}</p>
                <p>Avg response: {t.averageResponseMs} ms</p>
                <p>Credits: {t.creditConsumption}</p>
                <p>Failure rate: {t.failureRate}%</p>
                <p>Revenue/tool: ₹{Number(t.revenueGenerated).toFixed(2)}</p>
              </div>
              {t.mostActiveUsers.length ? (
                <div className="mt-3 text-xs text-slate-300">
                  Top users: {t.mostActiveUsers.map((user) => `${user.email} (${user.count})`).join(", ")}
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
