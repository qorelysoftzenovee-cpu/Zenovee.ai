import { getSupabaseAdmin } from "@/lib/supabase/admin";

const DAY_MS = 24 * 60 * 60 * 1000;

type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  created_at: string;
  last_login_at: string | null;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_name: string;
  status: string;
  current_period_end: string | null;
  next_renewal_at: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
};

type PaymentRow = {
  id: string;
  user_id: string;
  payment_amount: number;
  status: string;
  created_at: string;
  plan: string;
  currency: string;
  failure_reason: string | null;
};

type CreditRow = {
  user_id: string;
  available_credits: number;
  used_credits: number;
  total_credits: number;
};

type ExecutionRow = {
  id: string;
  user_id: string;
  tool_id: string;
  tool_name: string;
  status: string;
  credits_charged: number;
  estimated_api_cost: number;
  execution_ms: number | null;
  created_at: string;
};

type ApiUsageRow = {
  id: string;
  user_id: string;
  provider: string;
  model: string;
  total_tokens: number;
  estimated_cost: number;
  status: string;
  latency_ms: number | null;
  created_at: string;
};

type CreditTransactionRow = {
  id: string;
  user_id: string;
  transaction_type: string;
  credits: number;
  created_at: string;
};

type BillingEventRow = {
  id: string;
  event_type: string;
  user_id: string | null;
  created_at: string;
};

function num(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function dayKey(value: string) {
  return value.slice(0, 10);
}

function dayLabel(key: string) {
  return new Date(`${key}T00:00:00.000Z`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildSeries(days: number, values: Record<string, number>) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - index - 1));
    const key = date.toISOString().slice(0, 10);

    return {
      key,
      label: dayLabel(key),
      value: num(values[key]),
    };
  });
}

export async function getAdminOverviewData() {
  const supabase = getSupabaseAdmin();
  const since30 = new Date(Date.now() - 30 * DAY_MS).toISOString();

  const [usersRes, subscriptionsRes, paymentsRes, creditsRes, executionsRes, apiUsageRes, creditTxRes, billingEventsRes] = await Promise.all([
    supabase.from("users").select("id,email,name,role,status,created_at,last_login_at", { count: "exact" }).order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("id,user_id,plan_name,status,current_period_end,next_renewal_at,cancel_at_period_end,updated_at").order("updated_at", { ascending: false }),
    supabase.from("payments").select("id,user_id,payment_amount,status,created_at,plan,currency,failure_reason").order("created_at", { ascending: false }).limit(500),
    supabase.from("user_credits").select("user_id,available_credits,used_credits,total_credits"),
    supabase.from("tool_executions").select("id,user_id,tool_id,tool_name,status,credits_charged,estimated_api_cost,execution_ms,created_at").order("created_at", { ascending: false }).limit(1000),
    supabase.from("api_usage_logs").select("id,user_id,provider,model,total_tokens,estimated_cost,status,latency_ms,created_at").order("created_at", { ascending: false }).limit(1000),
    supabase.from("credit_transactions").select("id,user_id,transaction_type,credits,created_at").order("created_at", { ascending: false }).limit(1000),
    supabase.from("billing_events").select("id,event_type,user_id,created_at").order("created_at", { ascending: false }).limit(250),
  ]);

  const users = (usersRes.data ?? []) as AdminUserRow[];
  const subscriptions = (subscriptionsRes.data ?? []) as SubscriptionRow[];
  const payments = (paymentsRes.data ?? []) as PaymentRow[];
  const credits = (creditsRes.data ?? []) as CreditRow[];
  const executions = (executionsRes.data ?? []) as ExecutionRow[];
  const apiUsage = (apiUsageRes.data ?? []) as ApiUsageRow[];
  const creditTransactions = (creditTxRes.data ?? []) as CreditTransactionRow[];
  const billingEvents = (billingEventsRes.data ?? []) as BillingEventRow[];

  const userMap = new Map(users.map((user) => [user.id, user]));

  const totalRevenue = payments.filter((payment) => payment.status === "SUCCESS").reduce((sum, payment) => sum + num(payment.payment_amount), 0);
  const monthlyRevenue = payments.filter((payment) => payment.status === "SUCCESS" && payment.created_at >= since30).reduce((sum, payment) => sum + num(payment.payment_amount), 0);
  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "ACTIVE").length;
  const failedPayments = payments.filter((payment) => payment.status === "FAILED").length;
  const refundCount = payments.filter((payment) => payment.status === "REFUNDED").length;
  const creditsConsumed = credits.reduce((sum, credit) => sum + num(credit.used_credits), 0);
  const creditsRemaining = credits.reduce((sum, credit) => sum + num(credit.available_credits), 0);
  const totalApiCost = apiUsage.reduce((sum, row) => sum + num(row.estimated_cost), 0);
  const totalApiRequests = apiUsage.length;
  const totalTokens = apiUsage.reduce((sum, row) => sum + num(row.total_tokens), 0);
  const apiFailures = apiUsage.filter((row) => row.status === "failed").length;
  const successfulExecutions = executions.filter((execution) => execution.status === "success").length;
  const failedExecutions = executions.filter((execution) => execution.status === "failed").length;
  const adminUsers = users.filter((user) => user.role === "admin").length;

  const signupByDay = users.reduce<Record<string, number>>((acc, user) => {
    const key = dayKey(user.created_at);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const revenueByDay = payments.reduce<Record<string, number>>((acc, payment) => {
    if (payment.status === "SUCCESS") {
      const key = dayKey(payment.created_at);
      acc[key] = (acc[key] ?? 0) + num(payment.payment_amount);
    }
    return acc;
  }, {});

  const apiByDay = apiUsage.reduce<Record<string, number>>((acc, row) => {
    const key = dayKey(row.created_at);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const toolMap = new Map<string, {
    usageCount: number;
    creditConsumption: number;
    apiCostEstimate: number;
    latencyTotal: number;
    latencyCount: number;
    failures: number;
    users: Map<string, number>;
  }>();

  for (const execution of executions) {
    const key = execution.tool_name || execution.tool_id || "Unknown tool";
    if (!toolMap.has(key)) {
      toolMap.set(key, {
        usageCount: 0,
        creditConsumption: 0,
        apiCostEstimate: 0,
        latencyTotal: 0,
        latencyCount: 0,
        failures: 0,
        users: new Map(),
      });
    }

    const entry = toolMap.get(key)!;
    entry.usageCount += 1;
    entry.creditConsumption += num(execution.credits_charged);
    entry.apiCostEstimate += num(execution.estimated_api_cost);
    if (execution.execution_ms) {
      entry.latencyTotal += num(execution.execution_ms);
      entry.latencyCount += 1;
    }
    if (execution.status === "failed") {
      entry.failures += 1;
    }
    entry.users.set(execution.user_id, (entry.users.get(execution.user_id) ?? 0) + 1);
  }

  const toolsAnalytics = [...toolMap.entries()]
    .map(([tool, stats]) => ({
      tool,
      usageCount: stats.usageCount,
      creditConsumption: stats.creditConsumption,
      apiCostEstimate: stats.apiCostEstimate,
      averageResponseMs: stats.latencyCount ? Math.round(stats.latencyTotal / stats.latencyCount) : 0,
      failureRate: stats.usageCount ? Number(((stats.failures / stats.usageCount) * 100).toFixed(2)) : 0,
      revenueGenerated: stats.creditConsumption,
      mostActiveUsers: [...stats.users.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId, count]) => ({
          userId,
          email: userMap.get(userId)?.email ?? userId,
          count,
        })),
    }))
    .sort((a, b) => b.usageCount - a.usageCount);

  const topUsers = users
    .map((user) => {
      const userExecutions = executions.filter((execution) => execution.user_id === user.id);
      const userPayments = payments.filter((payment) => payment.user_id === user.id && payment.status === "SUCCESS");

      return {
        userId: user.id,
        email: user.email,
        name: user.name,
        totalRuns: userExecutions.length,
        totalCredits: userExecutions.reduce((sum, execution) => sum + num(execution.credits_charged), 0),
        totalSpend: userPayments.reduce((sum, payment) => sum + num(payment.payment_amount), 0),
        lastActiveAt: userExecutions[0]?.created_at ?? user.last_login_at,
      };
    })
    .sort((a, b) => b.totalSpend - a.totalSpend || b.totalCredits - a.totalCredits || b.totalRuns - a.totalRuns)
    .slice(0, 10);

  const recentPayments = payments.slice(0, 12).map((payment) => ({
    ...payment,
    user: userMap.get(payment.user_id) ?? null,
  }));

  const recentApiUsage = apiUsage.slice(0, 12).map((row) => ({
    ...row,
    user: userMap.get(row.user_id) ?? null,
  }));

  const recentSubscriptions = subscriptions.slice(0, 12).map((subscription) => ({
    ...subscription,
    user: userMap.get(subscription.user_id) ?? null,
  }));

  return {
    totals: {
      totalUsers: usersRes.count ?? users.length,
      adminUsers,
      activeSubscriptions,
      totalRevenue,
      monthlyRevenue,
      failedPayments,
      refundCount,
      creditsConsumed,
      creditsRemaining,
      totalApiCost,
      totalApiRequests,
      totalTokens,
      successfulExecutions,
      failedExecutions,
      apiFailures,
      billingEvents: billingEvents.length,
      usageDebits: creditTransactions.filter((entry) => entry.transaction_type === "usage_debit").length,
      refunds: creditTransactions.filter((entry) => entry.transaction_type === "refund").length,
    },
    charts: {
      userGrowth: buildSeries(14, signupByDay),
      revenue: buildSeries(14, revenueByDay),
      apiRequests: buildSeries(14, apiByDay),
      topTools: toolsAnalytics.slice(0, 6).map((tool) => ({ label: tool.tool, value: tool.usageCount })),
    },
    mostUsedTools: toolsAnalytics.slice(0, 8),
    toolsAnalytics,
    topUsers,
    recentPayments,
    recentApiUsage,
    recentSubscriptions,
  };
}
