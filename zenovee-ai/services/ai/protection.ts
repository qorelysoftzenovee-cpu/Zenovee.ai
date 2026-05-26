import { supabaseAdmin } from "@/lib/supabase/admin";
import { CreditService } from "@/lib/services/CreditService";
import type { Json } from "@/lib/supabase/types";
import { getPlanLimits, resolvePlanId } from "@/lib/billing/plans";

type PlanId = "starter" | "growth" | "scale";
type UsageClass = "standard" | "heavy";

const HEAVY_MULTIPLIER = 0.35;
const NEW_ACCOUNT_DAYS = 7;
const NEW_ACCOUNT_MULTIPLIER = 0.7;
const MAX_PROMPT_CHARS = 12_000;
const MAX_RETRY_COUNT = 4;
const RAPID_SPAM_WINDOW_MS = 12_000;
const RAPID_SPAM_THRESHOLD = 5;
const COOLDOWN_MINUTES = 20;

export class AIProtectionError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code:
      | "RATE_LIMIT_HOURLY"
      | "RATE_LIMIT_DAILY"
      | "COOLDOWN_ACTIVE"
      | "INVALID_REQUEST"
      | "PROMPT_TOO_LARGE"
      | "CREDITS_REQUIRED"
      | "ABUSE_DETECTED"
      | "PROVIDER_UNAVAILABLE"
      | "PROVIDER_RATE_LIMIT"
  ) {
    super(message);
  }
}

export type ProtectionContext = {
  userId: string;
  toolId: string;
  usageClass: UsageClass;
  prompt: string;
  input: Record<string, unknown>;
  ipAddress: string;
};

async function getPlan(userId: string): Promise<PlanId> {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("plan_id,plan_name,status")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle<{ plan_id: string; plan_name: string; status: string }>();

  const raw = resolvePlanId(data?.plan_id ?? data?.plan_name);
  if (raw === "growth" || raw === "scale") return raw;
  return "starter";
}

async function getAccountAgeDays(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("created_at")
    .eq("id", userId)
    .maybeSingle<{ created_at: string }>();

  if (!data?.created_at) return 999;
  const created = new Date(data.created_at).getTime();
  return Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));
}

async function countRequestsSince(filters: {
  sinceIso: string;
  userId?: string;
  ipAddress?: string;
  usageClass?: UsageClass;
}): Promise<number> {
  let query = supabaseAdmin
    .from("ai_request_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", filters.sinceIso)
    .in("status", ["allowed", "completed", "failed_provider", "failed_other"]);

  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.ipAddress) query = query.eq("ip_address", filters.ipAddress);
  if (filters.usageClass) query = query.eq("usage_class", filters.usageClass);

  const { count } = await query;
  return count ?? 0;
}

async function logRequest(args: {
  userId: string;
  toolId: string;
  ipAddress: string;
  usageClass: UsageClass;
  planId: PlanId;
  status: string;
  promptChars: number;
  failureReason?: string;
  abuseScore?: number;
  metadata?: Json;
}) {
  await supabaseAdmin.from("ai_request_logs").insert({
    user_id: args.userId,
    tool_id: args.toolId,
    ip_address: args.ipAddress,
    usage_class: args.usageClass,
    plan_id: args.planId,
    status: args.status,
    prompt_chars: args.promptChars,
    failure_reason: args.failureReason ?? null,
    abuse_score: args.abuseScore ?? 0,
    metadata: args.metadata ?? null,
  });
}

async function readCooldown(userId: string, ipAddress: string) {
  const nowIso = new Date().toISOString();
  const { data } = await supabaseAdmin
    .from("ai_cooldowns")
    .select("scope_key,cooldown_until")
    .in("scope_key", [`user:${userId}`, `ip:${ipAddress}`])
    .gt("cooldown_until", nowIso);
  return data ?? [];
}

async function createCooldown(scopeKey: string, reason: string) {
  const cooldownUntil = new Date(Date.now() + COOLDOWN_MINUTES * 60 * 1000).toISOString();
  await supabaseAdmin.from("ai_cooldowns").upsert(
    {
      scope_key: scopeKey,
      reason,
      cooldown_until: cooldownUntil,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "scope_key" }
  );
}

export class AIProtectionService {
  static async validateBeforeGeneration(context: ProtectionContext) {
    if (!context.toolId || !context.prompt) {
      throw new AIProtectionError("Invalid generation request payload.", 400, "INVALID_REQUEST");
    }

    if (context.prompt.length > MAX_PROMPT_CHARS) {
      await logRequest({
        userId: context.userId,
        toolId: context.toolId,
        ipAddress: context.ipAddress,
        usageClass: context.usageClass,
        planId: "starter",
        status: "blocked_prompt_too_large",
        promptChars: context.prompt.length,
        failureReason: "PROMPT_TOO_LARGE",
      });
      throw new AIProtectionError("Prompt exceeds allowed size. Please shorten and retry.", 400, "PROMPT_TOO_LARGE");
    }

    const credits = await CreditService.getCredits(context.userId);
    if (credits <= 0) {
      throw new AIProtectionError("Insufficient credits for generation.", 402, "CREDITS_REQUIRED");
    }

    const [planId, accountAgeDays] = await Promise.all([
      getPlan(context.userId),
      getAccountAgeDays(context.userId),
    ]);

    const cooldowns = await readCooldown(context.userId, context.ipAddress);
    if (cooldowns.length > 0) {
      throw new AIProtectionError(
        "You are temporarily on cooldown due to unusual activity. Please try again later.",
        429,
        "COOLDOWN_ACTIVE"
      );
    }

    const base = getPlanLimits(planId);
    const heavyFactor = context.usageClass === "heavy" ? HEAVY_MULTIPLIER : 1;
    const ageFactor = accountAgeDays < NEW_ACCOUNT_DAYS ? NEW_ACCOUNT_MULTIPLIER : 1;
    const hourlyLimit = Math.max(2, Math.floor(base.hourly * heavyFactor * ageFactor));
    const dailyLimit = Math.max(8, Math.floor(base.daily * heavyFactor * ageFactor));

    const now = Date.now();
    const [userHourly, userDaily, ipHourly, rapidSpamCount] = await Promise.all([
      countRequestsSince({ sinceIso: new Date(now - 60 * 60 * 1000).toISOString(), userId: context.userId }),
      countRequestsSince({ sinceIso: new Date(now - 24 * 60 * 60 * 1000).toISOString(), userId: context.userId }),
      countRequestsSince({ sinceIso: new Date(now - 60 * 60 * 1000).toISOString(), ipAddress: context.ipAddress }),
      countRequestsSince({ sinceIso: new Date(now - RAPID_SPAM_WINDOW_MS).toISOString(), userId: context.userId }),
    ]);

    if (rapidSpamCount >= RAPID_SPAM_THRESHOLD) {
      await Promise.all([
        createCooldown(`user:${context.userId}`, "rapid_spam_requests"),
        createCooldown(`ip:${context.ipAddress}`, "rapid_spam_requests"),
        supabaseAdmin.from("ai_abuse_flags").insert({
          user_id: context.userId,
          ip_address: context.ipAddress,
          flag_type: "rapid_spam",
          score: 95,
          metadata: { rapidSpamCount },
        }),
        supabaseAdmin.from("abuse_flags").insert({
          user_id: context.userId,
          ip_address: context.ipAddress,
          category: "rapid_spam",
          score: 95,
          details: { rapidSpamCount },
          reviewed: false,
        } as never),
      ]);
      throw new AIProtectionError("Suspicious rapid requests detected. Please try again later.", 429, "ABUSE_DETECTED");
    }

    if (userHourly >= hourlyLimit) {
      await createCooldown(`user:${context.userId}`, "hourly_limit_exceeded");
      throw new AIProtectionError(
        "You’ve reached your hourly generation limit. Please try again later or upgrade your plan.",
        429,
        "RATE_LIMIT_HOURLY"
      );
    }

    if (userDaily >= dailyLimit) {
      await createCooldown(`user:${context.userId}`, "daily_limit_exceeded");
      throw new AIProtectionError(
        "You’ve reached your daily generation limit. Please try again tomorrow or upgrade your plan.",
        429,
        "RATE_LIMIT_DAILY"
      );
    }

    if (ipHourly >= Math.max(20, hourlyLimit * 2)) {
      await createCooldown(`ip:${context.ipAddress}`, "ip_hourly_limit_exceeded");
      throw new AIProtectionError("Too many requests from this network. Please try again later.", 429, "ABUSE_DETECTED");
    }

    await logRequest({
      userId: context.userId,
      toolId: context.toolId,
      ipAddress: context.ipAddress,
      usageClass: context.usageClass,
      planId,
      status: "allowed",
      promptChars: context.prompt.length,
      metadata: {
        hourlyLimit,
        dailyLimit,
        accountAgeDays,
      },
    });

    return { planId, hourlyLimit, dailyLimit };
  }

  static async markCompletion(args: {
    userId: string;
    toolId: string;
    ipAddress: string;
    usageClass: UsageClass;
    planId: PlanId;
    promptChars: number;
    totalTokens: number;
  }) {
    await logRequest({
      userId: args.userId,
      toolId: args.toolId,
      ipAddress: args.ipAddress,
      usageClass: args.usageClass,
      planId: args.planId,
      status: "completed",
      promptChars: args.promptChars,
      metadata: { totalTokens: args.totalTokens },
    });
  }

  static async markProviderFailure(args: {
    userId: string;
    toolId: string;
    ipAddress: string;
    usageClass: UsageClass;
    planId: PlanId;
    promptChars: number;
    provider: string;
    error: string;
  }) {
    const isRateLimited = /429|rate limit|quota/i.test(args.error);
    await logRequest({
      userId: args.userId,
      toolId: args.toolId,
      ipAddress: args.ipAddress,
      usageClass: args.usageClass,
      planId: args.planId,
      status: "failed_provider",
      promptChars: args.promptChars,
      failureReason: args.error,
      metadata: { provider: args.provider, fallbackReady: true },
    });

    throw new AIProtectionError(
      isRateLimited
        ? "AI provider is temporarily rate limited. Please retry shortly."
        : "AI provider is currently unavailable. Please try again in a moment.",
      503,
      isRateLimited ? "PROVIDER_RATE_LIMIT" : "PROVIDER_UNAVAILABLE"
    );
  }

  static sanitizeInput(input: unknown): Record<string, unknown> {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new AIProtectionError("Invalid request payload.", 400, "INVALID_REQUEST");
    }
    const json = input as Record<string, unknown>;
    const retries = Number(json.retryCount ?? 0);
    if (retries > MAX_RETRY_COUNT) {
      throw new AIProtectionError("Too many retries detected for this request.", 429, "ABUSE_DETECTED");
    }
    return json;
  }
}
