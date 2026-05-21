import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { BillingActions } from "@/components/billing/billing-actions";
import { listToolDefinitions } from "@/definitions";
import { requireStandardUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type UsageItem = {
  id: string;
  tool_name: string;
  credits_charged: number;
  status: string;
  created_at: string;
};

type PaymentItem = {
  id: string;
  payment_amount: number;
  status: string;
  created_at: string;
};

type CreditSummary = {
  available_credits: number;
};

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(dateValue: string) {
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
    supabaseAdmin.from("users").select("name").eq("id", user.id).maybeSingle<{ name: string | null }>(),
    supabaseAdmin
      .from("tool_executions")
      .select("id,tool_name,credits_charged,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("subscriptions")
      .select("plan_name,status,next_renewal_at")
      .eq("user_id", user.id)
      .maybeSingle<{ plan_name: string; status: string; next_renewal_at: string | null }>(),
    supabaseAdmin
      .from("payments")
      .select("id,payment_amount,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
    supabaseAdmin
      .from("user_credits")
      .select("available_credits")
      .eq("user_id", user.id)
      .maybeSingle<CreditSummary>(),
  ]);

  const profile = profileRes.data;
  const credits = creditSummaryRes.data?.available_credits ?? 0;
  const usage = (usageRes.data ?? []) as UsageItem[];
  const latestSubscription = latestSubscriptionRes.data;
  const payments = (paymentsRes.data ?? []) as PaymentItem[];

  const quickAccessTools = listToolDefinitions()
    .filter((tool) => tool.metadata.availability === "active" && (tool.metadata.visibility ?? "public") === "public")
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="surface-card p-5 md:p-6 border-border/60 bg-gradient-to-br from-card to-card/95 premium-surface">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="premium-label">Workspace overview</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Welcome back{profile?.name ? `, ${profile.name}` : ""}</h1>
            <p className="text-sm text-muted-foreground/80 max-w-2xl">Review your credits, recent generations, billing status, and quick access to all tools in one focused workspace.</p>
          </div>
          <div className="flex items-center gap-2">
            <LogoutButton />
            <Button asChild variant="secondary" size="sm"><Link href="/billing">Billing</Link></Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px] animate-enter">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Card className="border-border bg-card">
              <CardHeader><CardTitle>Current plan</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">{latestSubscription?.plan_name ?? "No plan"}</p>
                <p className="text-sm text-muted-foreground">{latestSubscription?.status ?? "Inactive"}</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader><CardTitle>Credits remaining</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">{credits.toLocaleString()}</p>
                <p className="mt-2 text-sm text-muted-foreground">Use your credits across every launch tool in the workspace.</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader><CardTitle>What to do next</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Open the tools workspace, generate a structured result, then save or export it when it’s ready.</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardHeader><CardTitle>Recent generations</CardTitle></CardHeader>
            <CardContent>
              {usage.length ? (
                <div className="space-y-3">
                  {usage.map((item) => (
                    <div key={item.id} className="group surface-muted interactive-lift flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate group-hover:text-primary transition-colors duration-200">{item.tool_name}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">{formatDateTime(item.created_at)}</p>
                      </div>
                      <div className={cn("text-xs font-medium px-2.5 py-1 rounded-lg whitespace-nowrap", 
                        item.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                      )}>
                        {item.status === "completed" ? "✓ Complete" : item.status}
                      </div>
                      <p className="text-xs text-muted-foreground/60">{item.credits_charged} credits</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state py-6">
                  <div className="empty-state-icon">
                    <Sparkles size={20} />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="empty-state-title">No generations yet</h4>
                    <p className="empty-state-description">Create your first AI asset from the tools workspace to get started.</p>
                  </div>
                  <Button asChild variant="default" size="sm" className="mt-4">
                    <Link href="/dashboard/tools">Launch tools</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader><CardTitle>Quick access tools</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {quickAccessTools.map((tool) => (
                <Link key={tool.id} href="/dashboard/tools" className="surface-muted interactive-lift flex items-center justify-between gap-3 px-4 py-4 transition-all duration-200 hover:bg-primary/5 group">
                  <div className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground group-hover:text-primary transition-colors duration-200">{tool.metadata.name}</span>
                    <span className="block text-xs text-muted-foreground/70 mt-1">{tool.creditCost} credits</span>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader><CardTitle>Billing status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="surface-muted p-4 text-sm">
                <p className="text-muted-foreground">Current subscription</p>
                <p className="mt-1 text-base font-semibold">{latestSubscription ? `${latestSubscription.plan_name} • ${latestSubscription.status}` : "No active plan"}</p>
                <p className="mt-2 text-muted-foreground">Renewal: {latestSubscription?.next_renewal_at ? new Date(latestSubscription.next_renewal_at).toLocaleDateString() : "Not scheduled"}</p>
                <p className="mt-2 text-muted-foreground">Secure payments via Razorpay. Subscription status typically updates within a few moments after payment.</p>
              </div>
              <BillingActions />
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {payments.length ? (
                payments.map((item) => (
                  <div key={item.id} className="group surface-muted interactive-lift flex items-center justify-between gap-4 px-4 py-4 text-sm">
                    <div>
                      <p className={cn("font-medium", item.status === "completed" ? "text-success" : "text-warning")}>{item.status === "completed" ? "✓ Paid" : item.status}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{formatDateTime(item.created_at)}</p>
                    </div>
                    <p className="font-semibold text-foreground">{formatInr(Number(item.payment_amount))}</p>
                  </div>
                ))
              ) : (
                <div className="surface-muted px-5 py-8 text-center space-y-2">
                  <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">No payments yet</p>
                  <p className="text-xs text-muted-foreground/50">Payment history will appear here when your subscription begins.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
