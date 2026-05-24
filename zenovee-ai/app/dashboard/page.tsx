import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type CreditSummary = {
  available_credits: number;
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

  const [usageRes, latestSubscriptionRes, creditSummaryRes] = await Promise.all([
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
      .from("user_credits")
      .select("available_credits")
      .eq("user_id", user.id)
      .maybeSingle<CreditSummary>(),
  ]);

  const credits = creditSummaryRes.data?.available_credits ?? 0;
  const usage = (usageRes.data ?? []) as UsageItem[];
  const latestSubscription = latestSubscriptionRes.data;

  const quickAccessTools = listToolDefinitions()
    .filter((tool) => tool.metadata.availability === "active" && (tool.metadata.visibility ?? "public") === "public")
    .slice(0, 4);

  return (
    <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
      <Card className="border-slate-200 bg-white xl:col-span-2">
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild size="sm"><Link href="/dashboard/tools">Open Tools</Link></Button>
          <Button asChild variant="secondary" size="sm"><Link href="/history">History</Link></Button>
          <Button asChild variant="secondary" size="sm"><Link href="/outputs">Saved Outputs</Link></Button>
          <Button asChild variant="secondary" size="sm"><Link href="/exports">Exports</Link></Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white">
        <CardHeader><CardTitle>Current Plan</CardTitle></CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{latestSubscription?.plan_name ?? "No plan"}</p>
          <p className="text-sm text-muted-foreground">{latestSubscription?.status ?? "Inactive"}</p>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white">
        <CardHeader><CardTitle>Recent Generations</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {usage.length ? usage.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 px-3 py-2">
              <p className="text-sm font-medium">{item.tool_name}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)} • {item.credits_charged} credits</p>
            </div>
          )) : <p className="text-sm text-muted-foreground">No generations yet.</p>}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white">
        <CardHeader><CardTitle>Favorite Tools</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {quickAccessTools.slice(0, 3).map((tool) => (
            <Link key={tool.id} href="/dashboard/tools" className="block rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
              {tool.metadata.name}
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white">
        <CardHeader><CardTitle>Credits Remaining</CardTitle></CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{credits.toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
