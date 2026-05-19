import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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

  return (
    <PageShell title="User management" description="Review roles, subscription health, credit balances, and recent activity for every user." variant="admin" className="bg-transparent">
      <Card className="border-white/10 bg-white/[0.04] text-white">
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(usersRes.data ?? []).map((u) => {
            const sub = subscriptions.find((s) => s.user_id === u.id);
            const credit = credits.find((item) => item.user_id === u.id);
            const userPayments = payments.filter((p) => p.user_id === u.id).slice(0, 3);
            const userUsage = usage.filter((x) => x.user_id === u.id).slice(0, 3);
            return (
              <div key={u.id} className="surface-muted p-4 text-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-white">{u.name ?? u.email}</p>
                    <p className="text-xs text-slate-400 break-all">{u.email}</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="rounded-full border border-white/10 px-2 py-1">{u.role}</span>
                    <span className="rounded-full border border-white/10 px-2 py-1">{u.status}</span>
                    <span className="rounded-full border border-white/10 px-2 py-1">Available: {credit?.available_credits ?? 0}</span>
                    <span className="rounded-full border border-white/10 px-2 py-1">{sub?.plan_name ?? "No Plan"}</span>
                  </div>
                </div>
                <div className="mt-3 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-400">Recent payments</p>
                    {userPayments.length === 0 ? <p className="text-xs text-slate-400">None</p> : userPayments.map((p) => <p key={p.id} className="text-xs">{p.status} • ₹{Number(p.payment_amount).toFixed(2)}</p>)}
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-slate-400">Recent tool usage</p>
                    {userUsage.length === 0 ? <p className="text-xs text-slate-400">None</p> : userUsage.map((x, i) => <p key={`${u.id}-${i}`} className="text-xs">{x.tool_name} • {x.credits_charged} credits • {x.status}</p>)}
                  </div>
                  <form action="/api/admin/users" method="post" className="flex flex-col gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <button type="submit" name="action" value="activate" className="rounded-xl border border-emerald-500/30 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/10">Activate</button>
                    <button type="submit" name="action" value="suspend" className="rounded-xl border border-amber-500/30 px-3 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-500/10">Suspend</button>
                    <button type="submit" name="action" value="ban" className="rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-medium text-rose-200 transition hover:bg-rose-500/10">Ban</button>
                  </form>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </PageShell>
  );
}
