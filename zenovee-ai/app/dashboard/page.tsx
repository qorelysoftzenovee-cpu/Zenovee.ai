import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStandardUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBillingSnapshot } from "@/lib/billing/credits";
import { getActivePlans, getPlanById, getPlanDisplayName } from "@/lib/billing/plans";

type UsageItem = {
  id: string;
  tool_name: string;
  credits_charged: number;
  status: string;
  created_at: string;
};

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

  const [usageRes, billingSnapshot] = await Promise.all([
    supabaseAdmin
      .from("tool_executions")
      .select("id,tool_name,credits_charged,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    getBillingSnapshot(user.id),
  ]);

  const credits = billingSnapshot.availableCredits;
  const usage = (usageRes.data ?? []) as UsageItem[];
  const usageProgress = billingSnapshot.totalCredits > 0 ? Math.min(100, Math.round((billingSnapshot.usedCredits / billingSnapshot.totalCredits) * 100)) : 0;
  const currentPlan = getPlanById(billingSnapshot.plan ?? "");
  const nextPlan = getActivePlans().find((plan) => currentPlan && plan.monthlyPriceRupees > currentPlan.monthlyPriceRupees);

  return (
    <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
      <Card className="premium-surface-elevated border-white/70 xl:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="premium-label">Platform</p>
              <CardTitle className="mt-3 text-slate-950">Quick Actions</CardTitle>
            </div>
            <span className="stat-chip">Launch faster</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild size="sm"><Link href="/dashboard/tools">Open Tools</Link></Button>
          <Button asChild variant="secondary" size="sm"><Link href="/history">History</Link></Button>
          <Button asChild variant="secondary" size="sm"><Link href="/outputs">Saved Outputs</Link></Button>
          <Button asChild variant="secondary" size="sm"><Link href="/exports">Exports</Link></Button>
        </CardContent>
      </Card>

      <Card className="premium-surface border-white/70 bg-white/92">
        <CardHeader><CardTitle className="text-slate-950">Current Plan</CardTitle></CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-slate-950">{getPlanDisplayName(billingSnapshot.plan)}</p>
          <p className="text-xs text-muted-foreground mt-1">{billingSnapshot.subscriptionStatus ?? "Inactive"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Renewal: {billingSnapshot.renewalAt ? formatDateTime(billingSnapshot.renewalAt) : "N/A"}
          </p>
          {currentPlan ? <p className="mt-2 text-xs text-muted-foreground">Plan limits: {currentPlan.limits.hourly.toLocaleString()} hourly • {currentPlan.limits.daily.toLocaleString()} daily</p> : null}
        </CardContent>
      </Card>

      <Card className="premium-surface border-white/70 bg-white/92">
        <CardHeader><CardTitle className="text-slate-950">Recent Activity</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {usage.length ? usage.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-3 py-3">
              <p className="text-sm font-medium text-slate-900">{item.tool_name}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)} • {item.credits_charged} credits</p>
            </div>
          )) : <p className="text-sm text-muted-foreground">No generations yet.</p>}
        </CardContent>
      </Card>

      <Card className="premium-surface border-white/70 bg-white/92">
        <CardHeader><CardTitle className="text-slate-950">Credits</CardTitle></CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-slate-950">{credits.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">Available credits for your next tool runs.</p>
          <p className="mt-2 text-xs text-muted-foreground">Estimated runway: about {Math.max(1, Math.floor(credits / 300)).toLocaleString()} medium-tool runs remaining.</p>
        </CardContent>
      </Card>

      <Card className="premium-surface border-white/70 bg-white/92">
        <CardHeader><CardTitle className="text-slate-950">Usage</CardTitle></CardHeader>
        <CardContent>
          <p className="mt-1 text-xs text-muted-foreground">Usage progress: {usageProgress}% ({billingSnapshot.usedCredits}/{billingSnapshot.totalCredits})</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#0f172a_0%,#2563eb_100%)]" style={{ width: `${usageProgress}%` }} />
          </div>
          {nextPlan ? <p className="mt-2 text-xs text-primary">Upgrade suggestion: {nextPlan.displayName} unlocks {nextPlan.credits.toLocaleString()} monthly credits.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
