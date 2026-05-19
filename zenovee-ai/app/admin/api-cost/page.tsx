import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminApiCostPage() {
  await requireAdmin();
  const supabase = getSupabaseAdmin();

  const { data: apiUsage } = await supabase
    .from("api_usage")
    .select("id,provider,model,total_tokens,cost,status,latency_ms,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = apiUsage ?? [];
  const totalRequests = rows.length;
  const totalTokens = rows.reduce((s, r) => s + Number(r.total_tokens ?? 0), 0);
  const totalCost = rows.reduce((s, r) => s + Number(r.cost ?? 0), 0);
  const failed = rows.filter((r) => r.status === "failed").length;
  const avgLatency = rows.length
    ? Math.round(rows.reduce((s, r) => s + Number(r.latency_ms ?? 0), 0) / rows.length)
    : 0;

  return (
    <PageShell
      title="API & Cost Tracking"
      description="Groq/API requests, token economics, latency, failures, and abnormal usage signals."
      variant="admin"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card><CardHeader><CardTitle>Total Requests</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{totalRequests}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Total Tokens</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{totalTokens.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Estimated API Cost</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">₹{totalCost.toFixed(2)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Failed Requests</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{failed}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Avg Latency</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{avgLatency} ms</p></CardContent></Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Recent API Usage</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {rows.slice(0, 100).map((r) => (
            <div key={r.id} className="surface-muted flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span>{r.provider} • {r.model}</span>
              <span>{Number(r.total_tokens ?? 0).toLocaleString()} tokens</span>
              <span>₹{Number(r.cost ?? 0).toFixed(4)}</span>
              <span>{r.status}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </PageShell>
  );
}
