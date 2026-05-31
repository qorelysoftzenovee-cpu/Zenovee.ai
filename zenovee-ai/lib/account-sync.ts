import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getPlanById, resolvePlanId, type BillingPlanId } from "@/lib/billing/plans";
import { serverLog } from "@/lib/logger";

type EnsureUserAccountArgs = {
  userId: string;
  email?: string | null;
  name?: string | null;
  planId?: string | null;
  source: string;
};

type EnsureUserAccountResult = {
  userCreated: boolean;
  creditsCreated: boolean;
  creditsHealed: boolean;
  resolvedPlanId: BillingPlanId | null;
  seededCredits: number;
};

export class AccountSyncRequiredError extends Error {
  code = "ACCOUNT_SETUP_REQUIRED" as const;
  status = 409;

  constructor(message = "Your account billing profile is still syncing. Please try again in a moment.") {
    super(message);
    this.name = "AccountSyncRequiredError";
  }
}

function normalizeEmail(email?: string | null) {
  const value = email?.trim().toLowerCase();
  return value && value.length > 0 ? value : null;
}

function normalizeName(name?: string | null) {
  const value = name?.trim();
  return value && value.length > 0 ? value : null;
}

export async function ensureUserAccountState(args: EnsureUserAccountArgs): Promise<EnsureUserAccountResult> {
  const supabaseAdmin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  try {
    const [{ data: profile }, { data: credits }, { data: subscription }, { data: latestSuccessfulPayment }] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("id,email,name")
        .eq("id", args.userId)
        .maybeSingle<{ id: string; email: string; name: string | null }>(),
      supabaseAdmin
        .from("user_credits")
        .select("user_id,total_credits,used_credits,available_credits,subscription_credits,subscription_used,addon_credits,addon_used")
        .eq("user_id", args.userId)
        .maybeSingle<{
          user_id: string;
          total_credits: number;
          used_credits: number;
          available_credits: number;
          subscription_credits: number;
          subscription_used: number;
          addon_credits: number;
          addon_used: number;
        }>(),
      supabaseAdmin
        .from("subscriptions")
        .select("plan_id,plan_name,status")
        .eq("user_id", args.userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ plan_id?: string | null; plan_name?: string | null; status?: string | null }>(),
      supabaseAdmin
        .from("payments")
        .select("id,plan,status,razorpay_transaction_id")
        .eq("user_id", args.userId)
        .eq("status", "SUCCESS")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string; plan?: string | null; status?: string | null; razorpay_transaction_id?: string | null }>(),
    ]);

    let resolvedEmail = normalizeEmail(args.email) ?? normalizeEmail(profile?.email);
    let resolvedName = normalizeName(args.name) ?? normalizeName(profile?.name);

    if (!resolvedEmail || !profile) {
      const { data: authUserResult, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(args.userId);
      if (authUserError || !authUserResult.user?.id || !authUserResult.user.email) {
        throw new AccountSyncRequiredError();
      }

      resolvedEmail = normalizeEmail(authUserResult.user.email) ?? resolvedEmail;
      resolvedName = normalizeName(String(authUserResult.user.user_metadata?.name ?? "")) ?? resolvedName;
    }

    if (!resolvedEmail) {
      throw new AccountSyncRequiredError();
    }

    const resolvedPlanId = resolvePlanId(
      args.planId ?? subscription?.plan_id ?? subscription?.plan_name ?? latestSuccessfulPayment?.plan ?? null
    );
    const planCredits = resolvedPlanId ? Number(getPlanById(resolvedPlanId)?.credits ?? 0) : 0;
    const hasPaidEntitlement = Boolean(resolvedPlanId) && Boolean(subscription?.status === "ACTIVE" || subscription?.status === "PAST_DUE" || latestSuccessfulPayment?.status === "SUCCESS");

    let userCreated = false;
    if (!profile) {
      const { error: insertProfileError } = await supabaseAdmin.from("users").upsert(
        {
          id: args.userId,
          email: resolvedEmail,
          name: resolvedName,
        } as never,
        { onConflict: "id" }
      );

      if (insertProfileError) {
        throw new AccountSyncRequiredError();
      }
      userCreated = true;
    } else if (resolvedEmail && resolvedEmail !== normalizeEmail(profile.email)) {
      await supabaseAdmin
        .from("users")
        .update({
          email: resolvedEmail,
          name: resolvedName ?? profile.name,
        } as never)
        .eq("id", args.userId);
    }

    let creditsCreated = false;
    if (!credits) {
      const seededCredits = hasPaidEntitlement ? planCredits : 0;
      const { error: insertCreditsError } = await supabaseAdmin.from("user_credits").upsert(
        {
          user_id: args.userId,
          total_credits: seededCredits,
          used_credits: 0,
          available_credits: seededCredits,
          subscription_credits: seededCredits,
          subscription_used: 0,
          addon_credits: 0,
          addon_used: 0,
          updated_at: nowIso,
        } as never,
        { onConflict: "user_id" }
      );

      if (insertCreditsError) {
        throw new AccountSyncRequiredError();
      }
      creditsCreated = true;

      serverLog({
        level: "info",
        route: "lib/account-sync.ensureUserAccountState",
        message: "Missing user credits row healed",
        metadata: {
          userId: args.userId,
          source: args.source,
          resolvedPlanId,
          seededCredits,
        },
      });

      return { userCreated, creditsCreated, creditsHealed: false, resolvedPlanId, seededCredits };
    }

    const creditRowNeedsHealing = Boolean(credits?.user_id) && hasPaidEntitlement && Number(credits?.total_credits ?? 0) === 0 && Number(credits?.available_credits ?? 0) === 0;
    if (creditRowNeedsHealing && resolvedPlanId && planCredits > 0) {
      const recoveryReference = latestSuccessfulPayment?.razorpay_transaction_id
        ? `subscription:${latestSuccessfulPayment.razorpay_transaction_id}`
        : latestSuccessfulPayment?.id
        ? `subscription_payment:${latestSuccessfulPayment.id}`
        : `plan_recovery:${resolvedPlanId}:${args.userId}`;

      const { data: existingRecoveryTx } = await supabaseAdmin
        .from("credit_transactions")
        .select("id")
        .eq("user_id", args.userId)
        .eq("transaction_type", "subscription_credit")
        .eq("reference", recoveryReference)
        .maybeSingle<{ id: string }>();

      if (!existingRecoveryTx?.id) {
        const supabaseRpc = supabaseAdmin as unknown as {
          rpc: (
            fn: string,
            args: Record<string, unknown>
          ) => Promise<{ data: unknown; error: { message: string } | null }>;
        };

        const { error: allocationError } = await supabaseRpc.rpc("allocate_subscription_credits", {
          p_user_id: args.userId,
          p_credits: planCredits,
          p_plan_id: resolvedPlanId,
          p_reference: recoveryReference,
          p_reset_at: nowIso,
          p_metadata: {
            source: args.source,
            reason: "repair_zero_credit_paid_user",
          },
        });

        if (allocationError) {
          throw new AccountSyncRequiredError();
        }
      }

      serverLog({
        level: "info",
        route: "lib/account-sync.ensureUserAccountState",
        message: "Zero-credit paid user healed",
        metadata: {
          userId: args.userId,
          source: args.source,
          resolvedPlanId,
          seededCredits: planCredits,
          recoveryReference,
        },
      });

      return { userCreated, creditsCreated: false, creditsHealed: true, resolvedPlanId, seededCredits: planCredits };
    }

    if (userCreated) {
      serverLog({
        level: "info",
        route: "lib/account-sync.ensureUserAccountState",
        message: "Missing public user row healed",
        metadata: {
          userId: args.userId,
          source: args.source,
          resolvedPlanId,
        },
      });
    }

    return { userCreated, creditsCreated, creditsHealed: false, resolvedPlanId, seededCredits: 0 };
  } catch (error) {
    if (error instanceof AccountSyncRequiredError) {
      throw error;
    }

    serverLog({
      level: "error",
      route: "lib/account-sync.ensureUserAccountState",
      message: "Failed to synchronize account state.",
      error,
      metadata: {
        userId: args.userId,
        source: args.source,
      },
    });
    throw new AccountSyncRequiredError();
  }
}