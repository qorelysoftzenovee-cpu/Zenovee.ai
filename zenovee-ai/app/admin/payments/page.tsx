import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function formatInr(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const supabase = getSupabaseAdmin();

  const [paymentsRes, subscriptionsRes, eventsRes, usersRes] = await Promise.all([
    supabase.from("payments").select("id,user_id,payment_amount,status,plan,currency,failure_reason,created_at").order("created_at", { ascending: false }).limit(250),
    supabase.from("subscriptions").select("id,user_id,plan_name,status,next_renewal_at,cancel_at_period_end").order("updated_at", { ascending: false }).limit(100),
    supabase.from("billing_events").select("id,event_type,user_id,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("users").select("id,email,name").limit(200),
  ]);

  const users = new Map((usersRes.data ?? []).map((user) => [user.id, user]));
  const payments = paymentsRes.data ?? [];
  const failed = payments.filter((payment) => payment.status === "FAILED");
  const successfulRevenue = payments.filter((payment) => payment.status === "SUCCESS").reduce((sum, payment) => sum + Number(payment.payment_amount ?? 0), 0);

  return (
    <PageShell title="Payments" description="Live payment operations, subscription sync visibility, and webhook-backed billing review." variant="admin" className="bg-transparent">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="admin-surface"><CardHeader><CardTitle>Total Payments</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{payments.length}</p></CardContent></Card>
        <Card className="admin-surface"><CardHeader><CardTitle>Successful Revenue</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{formatInr(successfulRevenue)}</p></CardContent></Card>
        <Card className="admin-surface"><CardHeader><CardTitle>Failed Payments</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{failed.length}</p></CardContent></Card>
        <Card className="admin-surface"><CardHeader><CardTitle>Webhook Events</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{(eventsRes.data ?? []).length}</p></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="admin-surface">
          <CardHeader><CardTitle>Recent Payments</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {payments.length ? payments.slice(0, 30).map((payment) => {
              const user = users.get(payment.user_id);
              return (
                <div key={payment.id} className="admin-row flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-white">{user?.name ?? user?.email ?? payment.user_id}</p>
                    <p className="text-xs text-slate-400">{payment.plan} • {payment.status} • {new Date(payment.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{formatInr(Number(payment.payment_amount))}</p>
                    {payment.failure_reason ? <p className="text-xs text-rose-300">{payment.failure_reason}</p> : null}
                  </div>
                </div>
              );
            }) : <div className="admin-row text-sm text-slate-400">No payment records yet.</div>}
          </CardContent>
        </Card>

        <Card className="admin-surface">
          <CardHeader><CardTitle>Subscription Billing Health</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(subscriptionsRes.data ?? []).length ? (subscriptionsRes.data ?? []).slice(0, 30).map((subscription) => {
              const user = users.get(subscription.user_id);
              return (
                <div key={subscription.id} className="admin-row text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{user?.name ?? user?.email ?? subscription.user_id}</p>
                      <p className="text-xs text-slate-400">{subscription.plan_name} • {subscription.status}</p>
                    </div>
                    <div className="text-right text-xs text-slate-300">
                      <p>Renewal: {subscription.next_renewal_at ? new Date(subscription.next_renewal_at).toLocaleDateString() : "N/A"}</p>
                      <p>{subscription.cancel_at_period_end ? "Cancels at period end" : "Auto-renewing"}</p>
                    </div>
                  </div>
                </div>
              );
            }) : <div className="admin-row text-sm text-slate-400">No subscription records yet.</div>}
          </CardContent>
        </Card>

        <Card className="admin-surface xl:col-span-2">
          <CardHeader><CardTitle>Recent Billing Events</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(eventsRes.data ?? []).length ? (eventsRes.data ?? []).slice(0, 30).map((event) => {
              const user = event.user_id ? users.get(event.user_id) : undefined;
              return (
                <div key={event.id} className="admin-row flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-white">{event.event_type}</p>
                    <p className="text-xs text-slate-400">{user?.name ?? user?.email ?? event.user_id ?? "System"}</p>
                  </div>
                  <p className="text-xs text-slate-300">{new Date(event.created_at).toLocaleString()}</p>
                </div>
              );
            }) : <div className="admin-row text-sm text-slate-400">No billing events recorded yet.</div>}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}