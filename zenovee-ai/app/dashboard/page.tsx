import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type UsageItem = {
  id: string;
  tool_name: string;
  cost: number;
  created_at: string;
};

export default async function DashboardPage() {
  const user = await requireUser();

  const [profileRes, creditRes, usageRes, latestSubscriptionRes] = await Promise.all([
    supabaseAdmin.from("users").select("name,status").eq("id", user.id).maybeSingle<{ name: string | null; status: string }>(),
    supabaseAdmin.from("credits").select("balance").eq("user_id", user.id).maybeSingle<{ balance: number }>(),
    supabaseAdmin
      .from("tool_usage")
      .select("id,tool_name,cost,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("subscriptions")
      .select("plan_id,status,current_period_end")
      .eq("user_id", user.id)
      .maybeSingle<{ plan_id: string; status: string; current_period_end: string | null }>(),
  ]);

  const profile = profileRes.data;
  const credits = creditRes.data?.balance ?? 0;
  const usage = (usageRes.data ?? []) as UsageItem[];
  const latestSubscription = latestSubscriptionRes.data;

  const metrics = [
    { label: "Available Credits", value: String(credits) },
    { label: "Recent Runs", value: String(usage.length) },
    { label: "Current Plan", value: latestSubscription?.plan_id ?? "free" },
  ];

  return (
    <PageShell
      title="Dashboard"
      description={`Welcome back${profile?.name ? `, ${profile.name}` : ""}. Your AI workspace status is live and tracked in real time.`}
      actions={
        <div className="flex items-center gap-2">
          <LogoutButton />
          <Button asChild variant="secondary" size="sm">
            <Link href="/pricing">Manage Plan</Link>
          </Button>
          {user.role === "ADMIN" ? (
            <Button asChild size="sm">
              <Link href="/admin">Admin Panel</Link>
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <Card key={metric.label}>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{metric.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tracking-tight">{metric.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent AI activity</CardTitle>
            </CardHeader>
            <CardContent>
              {usage.length ? (
                <div className="space-y-3">
                  {usage.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                      <div>
                        <p className="font-medium">{item.tool_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">-{item.cost} credits</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No tool activity yet. Add credits and run your first AI workflow.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workspace status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-2xl bg-muted/30 p-4">
              <p className="text-muted-foreground">Account status</p>
              <p className="mt-1 text-base font-semibold">{profile?.status ?? "ACTIVE"}</p>
            </div>
            <div className="rounded-2xl bg-muted/30 p-4">
              <p className="text-muted-foreground">Subscription</p>
              <p className="mt-1 text-base font-semibold">
                {latestSubscription ? `${latestSubscription.plan_id} • ${latestSubscription.status}` : "No active subscription"}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/30 p-4">
              <p className="text-muted-foreground">Renewal / expiry</p>
              <p className="mt-1 text-base font-semibold">
                {latestSubscription?.current_period_end
                  ? new Date(latestSubscription.current_period_end).toLocaleDateString()
                  : "Not scheduled"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
