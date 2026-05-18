import Link from "next/link";
import { ArrowRight, Clock3, CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { BillingActions } from "@/components/billing/billing-actions";
import { LiveSync } from "@/components/realtime/live-sync";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type UsageItem = {
  id: string;
  tool_name: string;
  cost: number;
  created_at: string;
};

type PaymentItem = {
  id: string;
  payment_amount: number;
  currency: string;
  status: string;
  created_at: string;
  failure_reason: string | null;
};

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatGlobalDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatGlobalDateTime(dateValue: string) {
  return new Date(dateValue).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const user = await requireUser();

  const [profileRes, creditRes, usageRes, latestSubscriptionRes, paymentsRes] = await Promise.all([
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
      .select("plan_name,status,current_period_end,next_renewal_at,grace_until,cancel_at_period_end")
      .eq("user_id", user.id)
      .maybeSingle<{
        plan_name: string;
        status: string;
        current_period_end: string | null;
        next_renewal_at: string | null;
        grace_until: string | null;
        cancel_at_period_end: boolean;
      }>(),
    supabaseAdmin
      .from("payments")
      .select("id,payment_amount,currency,status,created_at,failure_reason")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const profile = profileRes.data;
  const credits = creditRes.data?.balance ?? 0;
  const usage = (usageRes.data ?? []) as UsageItem[];
  const latestSubscription = latestSubscriptionRes.data;
  const payments = (paymentsRes.data ?? []) as PaymentItem[];

  const metrics = [
    { label: "Available Credits", value: String(credits), hint: "Ready for new generations" },
    { label: "Recent Runs", value: String(usage.length), hint: "Latest tracked activity" },
    { label: "Current Plan", value: latestSubscription?.plan_name ?? "No plan", hint: latestSubscription?.status ?? "Inactive" },
  ];

  const recentActivity = usage.slice(0, 4);

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
      <LiveSync userId={user.id} />
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-6">
          <section className="surface-card overflow-hidden p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <div className="inline-flex items-center rounded-full border border-accent/15 bg-accent/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                  Workspace overview
                </div>
                <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Your AI workspace is live and ready for focused work.</h2>
                <p className="text-sm text-muted-foreground md:text-base">
                  Track credits, billing, recent activity, and premium tool access from a single view with live subscription visibility.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="surface-muted px-4 py-3 text-sm">
                  <p className="text-muted-foreground">Account</p>
                  <p className="mt-1 font-semibold">{profile?.status ?? "ACTIVE"}</p>
                </div>
                <div className="surface-muted px-4 py-3 text-sm">
                  <p className="text-muted-foreground">Renewal</p>
                  <p className="mt-1 font-semibold">{latestSubscription?.next_renewal_at ? formatGlobalDate(latestSubscription.next_renewal_at) : "Not scheduled"}</p>
                </div>
                <div className="surface-muted px-4 py-3 text-sm">
                  <p className="text-muted-foreground">Security</p>
                  <p className="mt-1 font-semibold">Protected billing</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <Card key={metric.label} className="hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{metric.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-3xl font-semibold tracking-tight">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tool workspace</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Run premium tools with structured outputs, export options, and usage history.
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border/70 px-3 py-1">Export-ready</span>
                  <span className="rounded-full border border-border/70 px-3 py-1">Publishable outputs</span>
                  <span className="rounded-full border border-border/70 px-3 py-1">Tracked usage</span>
                </div>
              </div>
              <Button asChild>
                <Link href="/dashboard/tools">Open tools <ArrowRight size={16} /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length ? (
                <div className="space-y-3">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="surface-muted flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{item.tool_name}</p>
                        <p className="text-sm text-muted-foreground">{formatGlobalDateTime(item.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="rounded-full border border-border/70 px-3 py-1">{item.cost} credits</span>
                        <Link href="/dashboard/tools" className="font-medium text-accent hover:underline">Open in tools</Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="surface-muted px-5 py-6 text-sm text-muted-foreground">
                  No recent tool activity yet. Open the tools workspace to run your first generation and start building a history.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing & subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="surface-muted p-4 text-sm">
                <p className="text-muted-foreground">Plan lifecycle</p>
                <p className="mt-1 font-semibold">
                  {latestSubscription ? `${latestSubscription.plan_name} • ${latestSubscription.status}` : "No active subscription"}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Renewal: {latestSubscription?.next_renewal_at ? formatGlobalDate(latestSubscription.next_renewal_at) : "Not scheduled"}
                </p>
                {latestSubscription?.grace_until ? (
                  <p className="status-warning mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium">Grace until: {formatGlobalDateTime(latestSubscription.grace_until)}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">Secure payments via Razorpay. Charges are processed in INR.</p>
              </div>
              <BillingActions />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing history</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length ? (
                <div className="space-y-3">
                  {payments.map((item) => (
                    <div key={item.id} className="surface-muted flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{item.status}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatGlobalDateTime(item.created_at)}
                        </p>
                        {item.failure_reason ? <p className="status-warning mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium">{item.failure_reason}</p> : null}
                      </div>
                      <p className="text-sm font-semibold">{formatInr(Number(item.payment_amount))}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="surface-muted px-5 py-6 text-sm text-muted-foreground">
                  No billing transactions yet. Your payment history will appear here once you subscribe or renew a plan.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workspace status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="surface-muted p-4">
              <p className="text-muted-foreground">Account status</p>
              <p className="mt-1 text-base font-semibold">{profile?.status ?? "ACTIVE"}</p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-muted-foreground">Subscription</p>
              <p className="mt-1 text-base font-semibold">
                {latestSubscription ? `${latestSubscription.plan_name} • ${latestSubscription.status}` : "No active subscription"}
              </p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-muted-foreground">Renewal / expiry</p>
              <p className="mt-1 text-base font-semibold">
                {latestSubscription?.current_period_end
                  ? formatGlobalDate(latestSubscription.current_period_end)
                  : "Not scheduled"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productivity shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { icon: Sparkles, label: "Run premium AI tools", href: "/dashboard/tools" },
              { icon: CreditCard, label: "Review plans and billing", href: "/pricing" },
              { icon: Clock3, label: "View recent usage and exports", href: "/dashboard/tools" },
              { icon: ShieldCheck, label: "Review trust and support details", href: "/contact" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className="surface-muted flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/70">
                  <span className="flex items-center gap-3 font-medium text-foreground"><Icon size={16} className="text-accent" /> {item.label}</span>
                  <ArrowRight size={16} className="text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
        </div>
      </div>
    </PageShell>
  );
}
