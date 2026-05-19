import { getSupabaseAdmin } from "@/lib/supabase/admin";

const DAY_MS = 24 * 60 * 60 * 1000;

function inr(amount: number) {
  return Number(amount || 0);
}

export async function getAdminOverviewData() {
  const supabase = getSupabaseAdmin();
  const since30 = new Date(Date.now() - 30 * DAY_MS).toISOString();
  const since7 = new Date(Date.now() - 7 * DAY_MS).toISOString();

  const [
    usersRes,
    subscriptionsRes,
    paymentsRes,
    userCreditsRes,
    toolUsageRes,
    apiUsageRes,
    abuseRes,
    requestLogsRes,
  ] = await Promise.all([
    supabase.from("users").select("id,created_at", { count: "exact" }),
    supabase.from("subscriptions").select("id,status,created_at"),
    supabase.from("payments").select("id,user_id,payment_amount,status,created_at,plan,failure_reason"),
    supabase.from("user_credits").select("user_id,available_credits,used_credits,total_credits"),
    supabase.from("tool_usage").select("id,user_id,tool_name,credits_consumed,api_cost,generation_duration_ms,created_at"),
    supabase.from("api_usage").select("id,user_id,provider,model,total_tokens,prompt_tokens,completion_tokens,cost,status,latency_ms,created_at"),
    supabase.from("ai_abuse_flags").select("id,user_id,score,created_at"),
    supabase.from("ai_request_logs").select("id,user_id,tool_id,status,created_at"),
  ]);

  const users = usersRes.data ?? [];
  const subscriptions = subscriptionsRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const credits = (userCreditsRes.data ?? []) as Array<{ user_id: string; available_credits: number; used_credits: number; total_credits: number }>;
  const toolUsage = toolUsageRes.data ?? [];
  const apiUsage = apiUsageRes.data ?? [];
  const abuse = abuseRes.data ?? [];
  const reqLogs = requestLogsRes.data ?? [];

  const totalRevenue = payments.filter((p) => p.status === "SUCCESS").reduce((s, p) => s + inr(p.payment_amount), 0);
  const mrr = payments
    .filter((p) => p.status === "SUCCESS" && new Date(p.created_at).getTime() >= Date.now() - 30 * DAY_MS)
    .reduce((s, p) => s + inr(p.payment_amount), 0);
  const activeSubscriptions = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const failedPayments = payments.filter((p) => p.status === "FAILED").length;
  const refundCount = payments.filter((p) => p.status === "REFUNDED").length;
  const creditsConsumed = credits.reduce((s, c) => s + Number(c.used_credits || 0), 0);
  const creditsRemaining = credits.reduce((s, c) => s + Number(c.available_credits || 0), 0);
  const apiCost = apiUsage.reduce((s, r) => s + Number(r.cost || 0), 0);
  const estimatedProfit = totalRevenue - apiCost;

  const toolMap = new Map<string, { usage: number; credits: number; apiCost: number; latencyTotal: number; latencyCount: number; failures: number; users: Map<string, number> }>();
  for (const row of toolUsage) {
    const key = row.tool_name || "unknown";
    if (!toolMap.has(key)) toolMap.set(key, { usage: 0, credits: 0, apiCost: 0, latencyTotal: 0, latencyCount: 0, failures: 0, users: new Map() });
    const item = toolMap.get(key)!;
    item.usage += 1;
    item.credits += Number(row.credits_consumed || 0);
    item.apiCost += Number(row.api_cost || 0);
    if (row.generation_duration_ms) {
      item.latencyTotal += Number(row.generation_duration_ms);
      item.latencyCount += 1;
    }
    item.users.set(row.user_id, (item.users.get(row.user_id) || 0) + 1);
  }

  const requestFailureByTool = new Map<string, number>();
  for (const l of reqLogs) {
    if (l.status !== "completed") {
      requestFailureByTool.set(l.tool_id || "unknown", (requestFailureByTool.get(l.tool_id || "unknown") || 0) + 1);
    }
  }

  const toolsAnalytics = [...toolMap.entries()].map(([tool, stats]) => {
    const activeUsers = [...stats.users.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      tool,
      usageCount: stats.usage,
      creditConsumption: stats.credits,
      apiCostEstimate: stats.apiCost,
      averageResponseMs: stats.latencyCount ? Math.round(stats.latencyTotal / stats.latencyCount) : 0,
      failureRate: stats.usage ? Number((((requestFailureByTool.get(tool) || 0) / stats.usage) * 100).toFixed(2)) : 0,
      mostActiveUsers: activeUsers,
      revenueGenerated: stats.credits,
    };
  }).sort((a, b) => b.usageCount - a.usageCount);

  const highestUsers = [...toolUsage.reduce((m, r) => m.set(r.user_id, (m.get(r.user_id) || 0) + Number(r.credits_consumed || 0)), new Map<string, number>()).entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const dailySignups = users
    .filter((u) => new Date(u.created_at).getTime() >= Date.now() - 30 * DAY_MS)
    .reduce<Record<string, number>>((acc, u) => {
      const d = u.created_at.slice(0, 10);
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});
  const dailyPayments = payments
    .filter((p) => p.status === "SUCCESS" && new Date(p.created_at).getTime() >= Date.now() - 30 * DAY_MS)
    .reduce<Record<string, number>>((acc, p) => {
      const d = p.created_at.slice(0, 10);
      acc[d] = (acc[d] || 0) + inr(p.payment_amount);
      return acc;
    }, {});

  const apiDaily = apiUsage
    .filter((a) => new Date(a.created_at).getTime() >= Date.now() - 30 * DAY_MS)
    .reduce<Record<string, { requests: number; tokens: number; cost: number }>>((acc, a) => {
      const d = a.created_at.slice(0, 10);
      if (!acc[d]) acc[d] = { requests: 0, tokens: 0, cost: 0 };
      acc[d].requests += 1;
      acc[d].tokens += Number(a.total_tokens || 0);
      acc[d].cost += Number(a.cost || 0);
      return acc;
    }, {});

  const dailyApiArray = Object.entries(apiDaily).sort(([a], [b]) => (a > b ? 1 : -1));
  const avgRequests = dailyApiArray.length ? dailyApiArray.reduce((s, [, v]) => s + v.requests, 0) / dailyApiArray.length : 0;
  const usageSpikes = dailyApiArray.filter(([, v]) => v.requests > avgRequests * 1.8).map(([d, v]) => ({ day: d, requests: v.requests }));

  const conversionRate = users.length ? Number(((activeSubscriptions / users.length) * 100).toFixed(2)) : 0;
  const abuseDetectedLast7d = abuse.filter((a) => new Date(a.created_at).getTime() >= new Date(since7).getTime()).length;

  return {
    totals: {
      totalRevenue,
      mrr,
      totalUsers: usersRes.count ?? users.length,
      activeSubscriptions,
      failedPayments,
      refundCount,
      creditsConsumed,
      creditsRemaining,
      apiCost,
      estimatedProfit,
      conversionRate,
      abuseDetectedLast7d,
    },
    charts: {
      dailySignups,
      dailyPayments,
      dailyApi: apiDaily,
    },
    mostUsedTools: toolsAnalytics.slice(0, 8),
    toolsAnalytics,
    highestConsumingUsers: highestUsers,
    usageSpikes,
  };
}
