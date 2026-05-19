import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = getSupabaseAdmin();

  const [usersRes, subscriptionsRes, paymentsRes, usageRes] = await Promise.all([
    supabase.from("users").select("id,email,name,status,credits_balance,last_login_at,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("subscriptions").select("user_id,plan_name,status,next_renewal_at"),
    supabase.from("payments").select("id,user_id,payment_amount,status,created_at").order("created_at", { ascending: false }).limit(300),
    supabase.from("tool_usage").select("user_id,tool_name,credits_consumed,created_at").order("created_at", { ascending: false }).limit(600),
  ]);

  const subscriptions = subscriptionsRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const usage = usageRes.data ?? [];

  return (
    <PageShell title="User Management" description="Search, monitor subscriptions/credits, and review user-level activity." variant="admin">
      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(usersRes.data ?? []).map((u) => {
            const sub = subscriptions.find((s) => s.user_id === u.id);
            const userPayments = payments.filter((p) => p.user_id === u.id).slice(0, 3);
            const userUsage = usage.filter((x) => x.user_id === u.id).slice(0, 3);
            return (
              <div key={u.id} className="surface-muted p-4 text-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold">{u.name ?? u.email}</p>
                    <p className="text-xs text-muted-foreground break-all">{u.id}</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="rounded-full border px-2 py-1">{u.status}</span>
                    <span className="rounded-full border px-2 py-1">Credits: {u.credits_balance}</span>
                    <span className="rounded-full border px-2 py-1">{sub?.plan_name ?? "No Plan"}</span>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Recent payments</p>
                    {userPayments.length === 0 ? <p className="text-xs text-muted-foreground">None</p> : userPayments.map((p) => <p key={p.id} className="text-xs">{p.status} • ₹{Number(p.payment_amount).toFixed(2)}</p>)}
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Recent tool usage</p>
                    {userUsage.length === 0 ? <p className="text-xs text-muted-foreground">None</p> : userUsage.map((x, i) => <p key={`${u.id}-${i}`} className="text-xs">{x.tool_name} • {x.credits_consumed} credits</p>)}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </PageShell>
  );
}
