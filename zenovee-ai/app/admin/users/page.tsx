import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { serverLog } from "@/lib/logger";

type SubscriptionRow = {
  user_id: string;
  plan_name: string;
  status: string;
  next_renewal_at: string | null;
};

type PaymentRow = {
  id: string;
  user_id: string;
  payment_amount: number;
  status: string;
  created_at: string;
};

type CreditRow = {
  user_id: string;
  available_credits: number;
  used_credits: number;
  total_credits: number;
};

type UsageRow = {
  user_id: string;
  tool_name: string;
  credits_charged: number;
  status: string;
  created_at: string;
};

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = getSupabaseAdmin();

  const [usersRes, subscriptionsRes, paymentsRes, creditsRes, usageRes] = await Promise.all([
    supabase.from("users").select("id,email,name,role,status,last_login_at,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("subscriptions").select("user_id,plan_name,status,next_renewal_at"),
    supabase.from("payments").select("id,user_id,payment_amount,status,created_at").order("created_at", { ascending: false }).limit(300),
    supabase.from("user_credits").select("user_id,available_credits,used_credits,total_credits"),
    supabase.from("tool_executions").select("user_id,tool_name,credits_charged,status,created_at").order("created_at", { ascending: false }).limit(600),
  ]);

  const subscriptions = (subscriptionsRes.data ?? []) as SubscriptionRow[];
  const payments = (paymentsRes.data ?? []) as PaymentRow[];
  const credits = (creditsRes.data ?? []) as CreditRow[];
  const usage = (usageRes.data ?? []) as UsageRow[];

  if (usersRes.error || subscriptionsRes.error || paymentsRes.error || creditsRes.error || usageRes.error) {
    serverLog({
      level: "error",
      route: "app/admin/users",
      message: "Failed to fetch complete admin users dataset.",
      metadata: {
        usersError: usersRes.error?.message ?? null,
        subscriptionsError: subscriptionsRes.error?.message ?? null,
        paymentsError: paymentsRes.error?.message ?? null,
        creditsError: creditsRes.error?.message ?? null,
        usageError: usageRes.error?.message ?? null,
      },
    });
  }

  const subscriptionByUser = new Map(subscriptions.map((item) => [item.user_id, item]));
  const creditsByUser = new Map(credits.map((item) => [item.user_id, item]));
  const recentPaymentsByUser = new Map<string, PaymentRow[]>();
  const recentUsageByUser = new Map<string, UsageRow[]>();

  for (const payment of payments) {
    const bucket = recentPaymentsByUser.get(payment.user_id) ?? [];
    if (bucket.length < 3) {
      bucket.push(payment);
      recentPaymentsByUser.set(payment.user_id, bucket);
    }
  }

  for (const run of usage) {
    const bucket = recentUsageByUser.get(run.user_id) ?? [];
    if (bucket.length < 3) {
      bucket.push(run);
      recentUsageByUser.set(run.user_id, bucket);
    }
  }

  return (
    <PageShell title="User management" description="Review roles, subscription health, credit balances, and recent activity for every user." variant="admin" className="bg-transparent">
      <Card className="admin-surface">
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(usersRes.data ?? []).length ? (usersRes.data ?? []).map((u) => {
            const sub = subscriptionByUser.get(u.id);
            const credit = creditsByUser.get(u.id);
            const userPayments = recentPaymentsByUser.get(u.id) ?? [];
            const userUsage = recentUsageByUser.get(u.id) ?? [];
            return (
              <div key={u.id} className="admin-row text-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{u.name ?? u.email}</p>
                    <p className="text-xs text-muted-foreground break-all">{u.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border border-border px-2 py-1">{u.role}</span>
                    <span className="rounded-full border border-border px-2 py-1">{u.status}</span>
                    <span className="rounded-full border border-border px-2 py-1">Available: {credit?.available_credits ?? 0}</span>
                    <span className="rounded-full border border-border px-2 py-1">{sub?.plan_name ?? "No plan"}</span>
                  </div>
                </div>
                <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Recent payments</p>
                    {userPayments.length === 0 ? <p className="text-xs text-muted-foreground">No payments yet</p> : userPayments.map((p) => <p key={p.id} className="text-xs text-muted-foreground">{p.status} • ₹{Number(p.payment_amount).toFixed(2)}</p>)}
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Recent tool usage</p>
                    {userUsage.length === 0 ? <p className="text-xs text-muted-foreground">No activity yet</p> : userUsage.map((x, i) => <p key={`${u.id}-${i}`} className="text-xs text-muted-foreground">{x.tool_name} • {x.credits_charged} credits • {x.status}</p>)}
                  </div>
                  <form action="/api/admin/users" method="post" className="flex flex-col gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <button type="submit" name="action" value="activate" className="rounded-xl border border-success/40 px-3 py-2 text-xs font-medium text-success transition hover:bg-success/10">Activate</button>
                    <button type="submit" name="action" value="suspend" className="rounded-xl border border-warning/40 px-3 py-2 text-xs font-medium text-warning transition hover:bg-warning/10">Suspend</button>
                    <button type="submit" name="action" value="ban" className="rounded-xl border border-danger/40 px-3 py-2 text-xs font-medium text-danger transition hover:bg-danger/10">Ban</button>
                  </form>
                </div>
              </div>
            );
          }) : <div className="admin-row text-sm text-muted-foreground">No users found yet.</div>}
        </CardContent>
      </Card>
    </PageShell>
  );
}
