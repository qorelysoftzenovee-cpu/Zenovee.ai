import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminBillingPage() {
  await requireAdmin();
  const supabase = getSupabaseAdmin();

  const [paymentsRes, subscriptionsRes, eventsRes] = await Promise.all([
    supabase.from("payments").select("id,user_id,payment_amount,status,plan,failure_reason,created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("subscriptions").select("id,user_id,plan_name,status,next_renewal_at,cancel_at_period_end,razorpay_subscription_id").order("updated_at", { ascending: false }).limit(200),
    supabase.from("billing_events").select("id,event_id,event_type,user_id,created_at").order("created_at", { ascending: false }).limit(200),
  ]);

  const payments = paymentsRes.data ?? [];
  const failed = payments.filter((p) => p.status === "FAILED");

  return (
    <PageShell title="Billing Management" description="Payments, failures, subscriptions, renewals, and webhook tracking." variant="admin">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card><CardHeader><CardTitle>Total Payments</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{payments.length}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Failed Payments</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{failed.length}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Webhook Events</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{(eventsRes.data ?? []).length}</p></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Payments</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {payments.slice(0, 50).map((p) => (
              <div key={p.id} className="surface-muted flex items-center justify-between px-4 py-3 text-sm">
                <span>{p.status} • {p.plan}</span>
                <span>₹{Number(p.payment_amount).toFixed(2)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Subscriptions / Renewals</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(subscriptionsRes.data ?? []).slice(0, 50).map((s) => (
              <div key={s.id} className="surface-muted px-4 py-3 text-sm">
                <p className="font-medium">{s.plan_name} • {s.status}</p>
                <p className="text-xs text-muted-foreground">Renewal: {s.next_renewal_at ?? "n/a"}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
