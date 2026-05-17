import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, BarChart3, CreditCard, ShieldCheck, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LiveSync } from "@/components/realtime/live-sync";

export default async function AdminPage() {
  const adminUser = await requireAdmin();

  const [usersRes, subscriptionsRes, paymentsRes, usageRes, apiUsageRes, protectionLogsRes, abuseFlagsRes] = await Promise.all([
    supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE"),
    supabaseAdmin.from("payments").select("payment_amount"),
    supabaseAdmin.from("tool_usage").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("api_usage").select("provider, model, prompt_tokens, completion_tokens, total_tokens"),
    supabaseAdmin
      .from("ai_request_logs")
      .select("user_id,tool_id,usage_class,status,created_at,failure_reason,abuse_score"),
    supabaseAdmin.from("ai_abuse_flags").select("user_id,ip_address,flag_type,score,created_at"),
  ]);

  const users = usersRes.count ?? 0;
  const subscriptions = subscriptionsRes.count ?? 0;
  const revenue = (paymentsRes.data ?? []).reduce((sum, item) => sum + Number(item.payment_amount ?? 0), 0);
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

  const adminMetrics = [
    { label: "Total Users", value: users, icon: Users },
    { label: "Active Subscriptions", value: subscriptions, icon: CreditCard },
    { label: "Tool Executions", value: usage, icon: Activity },
    { label: "Suspicious Users", value: suspiciousUsers, icon: AlertTriangle },
  ];

  const modelUsageEntries = Object.entries(modelUsage);
  const maxModelUsage = Math.max(...modelUsageEntries.map(([, count]) => count), 1);

  return (
    <PageShell
      title="Admin"
      description="System-level controls backed by persisted application data."
    >
      <LiveSync userId={adminUser.id} admin />
      <section className="surface-card mb-6 overflow-hidden p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center rounded-full border border-accent/15 bg-accent/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              Operations overview
            </div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Real-time visibility into growth, cost, usage, and protection signals.</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Monitor revenue, request volume, model demand, token usage, failure rates, and suspicious behavior from one operational surface.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="surface-muted px-4 py-3 text-sm"><p className="text-muted-foreground">Revenue</p><p className="mt-1 font-semibold">₹{revenue.toFixed(2)}</p></div>
            <div className="surface-muted px-4 py-3 text-sm"><p className="text-muted-foreground">API cost</p><p className="mt-1 font-semibold">${apiCost.toFixed(4)}</p></div>
            <div className="surface-muted px-4 py-3 text-sm"><p className="text-muted-foreground">Protection</p><p className="mt-1 font-semibold">{failedGenerations} failed / {suspiciousUsers} flagged</p></div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="hover:-translate-y-1">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Icon size={18} />
                </div>
                <CardTitle>{metric.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tracking-tight">{metric.value}</p>
              </CardContent>
            </Card>
          );
        })}

        <Card>
          <CardHeader><CardTitle>API Requests</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold tracking-tight">{apiRequests}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Token Usage</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold tracking-tight">{apiTotalTokens.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Hourly Requests</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold tracking-tight">{hourlyRequests}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Heavy Tool Requests</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-semibold tracking-tight">{heavyRequests}</p></CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>Model Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {modelUsageEntries.length ? modelUsageEntries.map(([model, count]) => (
            <div key={model} className="space-y-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium">{model}</span>
                <span className="text-muted-foreground">{count} requests</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(count / maxModelUsage) * 100}%` }} />
              </div>
            </div>
          )) : <div className="surface-muted px-5 py-6 text-sm text-muted-foreground">No model usage yet.</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operational health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="surface-muted flex items-center justify-between gap-4 px-4 py-4">
            <span className="flex items-center gap-2 font-medium"><BarChart3 size={16} className="text-accent" /> Revenue captured</span>
            <span>₹{revenue.toFixed(2)}</span>
          </div>
          <div className="surface-muted flex items-center justify-between gap-4 px-4 py-4">
            <span className="flex items-center gap-2 font-medium"><ShieldCheck size={16} className="text-accent" /> Failed generations</span>
            <span>{failedGenerations}</span>
          </div>
          <div className="surface-muted flex items-center justify-between gap-4 px-4 py-4">
            <span className="flex items-center gap-2 font-medium"><AlertTriangle size={16} className="text-accent" /> Suspicious users</span>
            <span>{suspiciousUsers}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Heavy Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {heavyUsers.length === 0 ? (
              <div className="surface-muted px-5 py-6 text-sm text-muted-foreground">No usage yet.</div>
            ) : (
              heavyUsers.map(([userId, count], index) => (
                <div key={userId} className="surface-muted flex flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">User {index + 1}</p>
                    <p className="text-xs text-muted-foreground break-all">{userId}</p>
                  </div>
                  <span className="rounded-full border border-border/70 px-3 py-1 text-sm">{count} completed generations</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </PageShell>
  );
}
