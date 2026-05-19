import Link from "next/link";
import { ArrowRight, CreditCard, Sparkles } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { BillingActions } from "@/components/billing/billing-actions";
import { LiveSync } from "@/components/realtime/live-sync";
import { listToolDefinitions } from "@/definitions";
import { requireStandardUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type UsageItem = {
  id: string;
  tool_name: string;
  credits_charged: number;
  status: string;
  error_message: string | null;
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

type CreditSummary = {
  available_credits: number;
  used_credits: number;
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
  const user = await requireStandardUser();

  const [profileRes, usageRes, latestSubscriptionRes, paymentsRes, creditSummaryRes] = await Promise.all([
    supabaseAdmin.from("users").select("name,status").eq("id", user.id).maybeSingle<{ name: string | null; status: string }>(),
    supabaseAdmin
      .from("tool_executions")
      .select("id,tool_name,credits_charged,status,error_message,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
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
    supabaseAdmin
      .from("user_credits")
      .select("available_credits,used_credits")
      .eq("user_id", user.id)
      .maybeSingle<CreditSummary>(),
  ]);

  const profile = profileRes.data;
  const credits = creditSummaryRes.data?.available_credits ?? 0;
  const creditsUsed = creditSummaryRes.data?.used_credits ?? 0;
  const usage = (usageRes.data ?? []) as UsageItem[];
  const latestSubscription = latestSubscriptionRes.data;
  const payments = (paymentsRes.data ?? []) as PaymentItem[];
  const recentActivity = usage.slice(0, 5);
  const quickAccessTools = listToolDefinitions().filter((tool) => tool.metadata.availability === "active").slice(0, 4);
  const latestPayment = payments[0];
  const totalCredits = credits + creditsUsed;
  const usagePercentage = totalCredits > 0 ? Math.min(100, Math.round((creditsUsed / totalCredits) * 100)) : 0;
  const planStatus = latestSubscription ? `${latestSubscription.plan_name} • ${latestSubscription.status}` : "No active plan";
  const billingStatus = latestPayment?.status ?? latestSubscription?.status ?? "Inactive";

  const metrics = [
    { label: "Current plan", value: latestSubscription?.plan_name ?? "None", hint: latestSubscription?.status ?? "Inactive" },
    { label: "Credits remaining", value: String(credits), hint: "Ready to use" },
    { label: "Credits used", value: String(creditsUsed), hint: `${usagePercentage}% of current total` },
    { label: "Billing status", value: billingStatus, hint: latestPayment ? `Last payment ${formatGlobalDate(latestPayment.created_at)}` : "No recent charge" },
  ];

  return (
    <PageShell
      title="Overview"
      description={`Welcome back${profile?.name ? `, ${profile.name}` : ""}. Track credits, billing, and recent runs from one focused view.`}
      actions={
        <div className="flex items-center gap-2">
          <LogoutButton />
          <Button asChild variant="secondary" size="sm">
            <Link href="/pricing">Manage Plan</Link>
          </Button>
        </div>
      }
    >
      <LiveSync userId={user.id} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-6">
          <section className="surface-card page-glow overflow-hidden p-6 md:p-8">
            <div className="grid gap-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <div className="premium-label">Plan & usage</div>
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Everything important at a glance</h2>
                  <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                    Keep track of your plan, available credits, and billing without digging through extra panels.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/dashboard/tools">
                    Open tools
                    <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                  <div key={metric.label} className="dashboard-metric">
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight">{metric.value}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{metric.hint}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">Credit usage</p>
                    <p className="mt-1 text-sm text-muted-foreground">{creditsUsed.toLocaleString()} used out of {totalCredits.toLocaleString() || 0} total credits this cycle.</p>
                  </div>
                  <p className="text-sm font-medium text-foreground">{usagePercentage}% used</p>
                </div>
                <div className="mt-4 h-2 rounded-full bg-white/8">
                  <div className="h-2 rounded-full bg-[linear-gradient(90deg,#8b5cf6_0%,#38bdf8_100%)]" style={{ width: `${usagePercentage}%` }} />
                </div>
              </div>
            </div>
          </section>

          <Card className="border-white/10">
            <CardHeader>
              <CardTitle>Recent tool runs</CardTitle>
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
                        <span className="rounded-full border border-white/10 px-3 py-1 text-muted-foreground">{item.credits_charged} credits</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${item.status === "success" ? "status-success" : item.status === "failed" ? "status-danger" : "surface-muted"}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="surface-muted px-5 py-6 text-sm text-muted-foreground">
                  No recent runs yet. Open the tools page to start your first workflow.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardHeader>
              <CardTitle>Quick access tools</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {quickAccessTools.map((tool) => (
                <Link
                  key={tool.id}
                  href="/dashboard/tools"
                  className="surface-muted flex items-center justify-between gap-3 px-4 py-4 transition-all hover:-translate-y-0.5 hover:bg-white/[0.06]"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">{tool.metadata.icon}</span>
                    <span>
                      <span className="block font-medium text-foreground">{tool.metadata.name}</span>
                      <span className="block text-sm text-muted-foreground">{tool.creditCost} credits • {tool.metadata.category}</span>
                    </span>
                  </span>
                  <ArrowRight size={16} className="text-muted-foreground" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-white/10">
            <CardHeader>
              <CardTitle>Billing status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="surface-muted p-4 text-sm">
                <p className="text-muted-foreground">Current subscription</p>
                <p className="mt-1 text-base font-semibold">{planStatus}</p>
                <p className="mt-2 text-muted-foreground">
                  Renewal: {latestSubscription?.next_renewal_at ? formatGlobalDate(latestSubscription.next_renewal_at) : "Not scheduled"}
                </p>
                {latestSubscription?.grace_until ? (
                  <p className="status-warning mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium">Grace until: {formatGlobalDateTime(latestSubscription.grace_until)}</p>
                ) : null}
              </div>
              <BillingActions />
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardHeader>
              <CardTitle>Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payments.length ? (
                payments.slice(0, 4).map((item) => (
                  <div key={item.id} className="surface-muted flex items-center justify-between gap-4 px-4 py-4 text-sm">
                    <div>
                      <p className="font-medium">{item.status}</p>
                      <p className="text-muted-foreground">{formatGlobalDateTime(item.created_at)}</p>
                    </div>
                    <p className="font-semibold">{formatInr(Number(item.payment_amount))}</p>
                  </div>
                ))
              ) : (
                <div className="surface-muted px-5 py-6 text-sm text-muted-foreground">
                  No billing history yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10">
            <CardHeader>
              <CardTitle>Useful links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { icon: Sparkles, label: "Run AI tools", href: "/dashboard/tools" },
                { icon: CreditCard, label: "Manage pricing", href: "/pricing" },
                { icon: Sparkles, label: "Contact support", href: "/contact" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.label} href={item.href} className="surface-muted flex items-center justify-between gap-3 px-4 py-3 transition-all hover:bg-white/[0.06]">
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
