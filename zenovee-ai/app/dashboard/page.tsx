import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
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
    <PageShell
      title="Dashboard"
      description={`Welcome back${profile?.name ? `, ${profile.name}` : ""}. Review your credits, recent work, billing status, and fastest path back into the workspace.`}
      actions={
        <div className="flex items-center gap-2">
          <LogoutButton />
          <Button asChild variant="secondary" size="sm">
            <Link href="/billing">Billing</Link>
          </Button>
        </div>
      }
    >
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
                    <div key={item.id} className="surface-muted interactive-lift flex flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{item.tool_name}</p>
                        <p className="text-sm text-muted-foreground">{formatDateTime(item.created_at)}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">{item.credits_charged} credits • {item.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="surface-muted px-5 py-6 text-sm text-muted-foreground">No generations yet. Start with one launch tool to create your first AI asset.</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader><CardTitle>Quick access tools</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {quickAccessTools.map((tool) => (
                <Link key={tool.id} href="/dashboard/tools" className="surface-muted interactive-lift flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-muted">
                  <span>
                    <span className="block font-medium text-foreground">{tool.metadata.name}</span>
                    <span className="block text-sm text-muted-foreground">{tool.creditCost} credits</span>
                  </span>
                  <ArrowRight size={16} className="text-muted-foreground" />
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
                <p className="mt-2 text-muted-foreground">Secure payments via Razorpay. Your subscription updates automatically after payment.</p>
              </div>
              <BillingActions />
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {payments.length ? (
                payments.map((item) => (
                  <div key={item.id} className="surface-muted interactive-lift flex items-center justify-between gap-4 px-4 py-4 text-sm">
                    <div>
                      <p className="font-medium">{item.status}</p>
                      <p className="text-muted-foreground">{formatDateTime(item.created_at)}</p>
                    </div>
                    <p className="font-semibold">{formatInr(Number(item.payment_amount))}</p>
                  </div>
                ))
              ) : (
                <div className="surface-muted px-5 py-6 text-sm text-muted-foreground">No payment history yet. When billing activity starts, it will appear here for quick review.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
