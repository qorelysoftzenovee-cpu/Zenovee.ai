import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminPage() {
  await requireAdmin();

  const [usersRes, subscriptionsRes, paymentsRes, usageRes] = await Promise.all([
    supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "ACTIVE"),
    supabaseAdmin.from("payments").select("amount"),
    supabaseAdmin.from("tool_usage").select("id", { count: "exact", head: true }),
  ]);

  const users = usersRes.count ?? 0;
  const subscriptions = subscriptionsRes.count ?? 0;
  const revenue = (paymentsRes.data ?? []).reduce((sum, item) => sum + Number(item.amount ?? 0), 0);
  const usage = usageRes.count ?? 0;

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
      </div>
    </PageShell>
  );
}
