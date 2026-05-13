import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminPage() {
  await requireAdmin();

  const [usersRes, subscriptionsRes, paymentsRes, usageRes, apiUsageRes, protectionLogsRes, abuseFlagsRes] = await Promise.all([
    supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE"),
    supabaseAdmin.from("payments").select("amount"),
    supabaseAdmin.from("tool_usage").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("api_usage").select("provider, model, prompt_tokens, completion_tokens, total_tokens"),
    supabaseAdmin
      .from("ai_request_logs")
      .select("user_id,tool_id,usage_class,status,created_at,failure_reason,abuse_score"),
    supabaseAdmin.from("ai_abuse_flags").select("user_id,ip_address,flag_type,score,created_at"),
  ]);

  const users = usersRes.count ?? 0;
  const subscriptions = subscriptionsRes.count ?? 0;
  const revenue = (paymentsRes.data ?? []).reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const usage = usageRes.count ?? 0;
  const apiUsageRows = apiUsageRes.data ?? [];
  const apiRequests = apiUsageRows.length;
  const apiTotalTokens = apiUsageRows.reduce((sum, row) => sum + Number(row.total_tokens ?? 0), 0);
  const apiCost = (apiUsageRows as Array<{ model: string; prompt_tokens: number; completion_tokens: number }>).reduce(
    (sum, row) => {
      const pricing: Record<string, { input: number; output: number }> = {
        "llama-3.1-70b-versatile": { input: 0.59, output: 0.79 },
        "llama-3.1-8b-instant": { input: 0.05, output: 0.08 },
        "mixtral-8x7b": { input: 0.24, output: 0.24 },
      };
      const selected = pricing[row.model] ?? { input: 0, output: 0 };
      return (
        sum +
        ((Number(row.prompt_tokens ?? 0) / 1_000_000) * selected.input +
          (Number(row.completion_tokens ?? 0) / 1_000_000) * selected.output)
      );
    },
    0
  );
  const modelUsage = apiUsageRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.model] = (acc[row.model] ?? 0) + 1;
    return acc;
  }, {});

  const protectionRows = protectionLogsRes.data ?? [];
  const abuseRows = abuseFlagsRes.data ?? [];
  const failedGenerations = protectionRows.filter((row) => row.status === "failed_provider").length;
  const suspiciousUsers = new Set(abuseRows.map((row) => row.user_id)).size;
  const heavyRequests = protectionRows.filter((row) => row.usage_class === "heavy").length;

  const latestRequestTimestamp = protectionRows.reduce((max, row) => {
    const ts = new Date(row.created_at).getTime();
    return ts > max ? ts : max;
  }, 0);
  const hourlyCutoff = latestRequestTimestamp - 60 * 60 * 1000;
  const hourlyRequests = protectionRows.filter((row) => new Date(row.created_at).getTime() >= hourlyCutoff).length;

  const heavyUsers = Object.entries(
    protectionRows.reduce<Record<string, number>>((acc, row) => {
      if (row.status === "completed") {
        acc[row.user_id] = (acc[row.user_id] ?? 0) + 1;
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <PageShell
      title="Admin"
      description="System-level controls backed by persisted application data."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{users}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{subscriptions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">
              ₹{revenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tool Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{usage}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{apiRequests}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{apiTotalTokens.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Cost (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">${apiCost.toFixed(4)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hourly Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{hourlyRequests}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failed Generations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{failedGenerations}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Heavy Tool Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{heavyRequests}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suspicious Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight">{suspiciousUsers}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Model Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(modelUsage).map(([model, count]) => (
              <p key={model} className="text-sm">
                <span className="font-medium">{model}:</span> {count}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Heavy Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {heavyUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No usage yet.</p>
            ) : (
              heavyUsers.map(([userId, count]) => (
                <p key={userId} className="text-sm">
                  <span className="font-medium">{userId}:</span> {count} completed generations
                </p>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
