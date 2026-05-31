import { NextResponse } from "next/server";
import { ToolExecutionService } from "@/services/tool-execution-service";
import { getExtensionUser, getRequestIpAddress } from "@/lib/extension-auth";
import { AIProtectionError } from "@/services/ai/protection";
import { AIGenerationError, toClientErrorDetails } from "@/services/ai/prompt-orchestrator";
import { jsonApiError, withApiErrorHandling } from "@/lib/runtime";
import { serverLog } from "@/lib/logger";
import { getBillingSnapshot, getToolCreditRule, ToolExecutionAccessError } from "@/lib/billing/credits";

export async function POST(request: Request) {
  return withApiErrorHandling("/api/extension/generate:POST", async () => {
    let userId: string | null = null;
    let requestedToolId: string | null = null;
    try {
      const user = await getExtensionUser(request);
      if (!user) {
        return jsonApiError("Unauthorized", 401);
      }
      userId = user.id;

      const { toolId, input, options } = await request.json();
      requestedToolId = typeof toolId === "string" ? toolId : null;
      const [billingSnapshot, toolRule] = await Promise.all([
        getBillingSnapshot(user.id),
        getToolCreditRule(toolId),
      ]);
      const creditsBefore = billingSnapshot.availableCredits;
      serverLog({
        level: "info",
        route: "/api/extension/generate:POST",
        message: "Generate clicked",
        metadata: {
          userId: user.id,
          toolId,
          currentBalance: billingSnapshot.availableCredits,
          requiredCredits: toolRule.creditCost,
          planId: billingSnapshot.plan,
          status: billingSnapshot.subscriptionStatus,
          credits: billingSnapshot.availableCredits,
          subscriptionLookupResult: billingSnapshot.subscriptionLookupResult,
          denialReason: null,
          accessDeniedReason: null,
        },
      });
      const result = await ToolExecutionService.execute({
        userId: user.id,
        toolId,
        rawInput: input,
        options,
        ipAddress: getRequestIpAddress(request),
        idempotencyKey: request.headers.get("x-idempotency-key"),
      });

      return NextResponse.json({
        success: true,
        data: result.output,
        executionId: result.executionId,
        usage: result.usage,
        generationMeta: result.meta,
        metrics: {
          creditsBefore,
          creditsAfter: result.remainingCredits,
        },
      });
    } catch (error) {
      if (error instanceof AIProtectionError) {
        const billingSnapshot = userId
          ? await getBillingSnapshot(userId)
          : {
              plan: null,
              subscriptionStatus: null,
              hasActiveSubscription: false,
              renewalAt: null,
              availableCredits: 0,
              totalCredits: 0,
              usedCredits: 0,
              subscriptionLookupResult: {
                subscriptionFound: false,
                paymentFound: false,
                rawSubscriptionStatus: null,
                fallbackActive: false,
              },
            };
        serverLog({
          level: "warn",
          route: "/api/extension/generate:POST",
          message: error.message,
          metadata: {
            userId,
            toolId: requestedToolId,
            planId: billingSnapshot.plan,
            status: billingSnapshot.subscriptionStatus,
            credits: billingSnapshot.availableCredits,
            subscriptionLookupResult: billingSnapshot.subscriptionLookupResult,
            accessDeniedReason: error.code,
          },
        });
        return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
      }

      if (error instanceof AIGenerationError) {
        serverLog({ level: "warn", route: "/api/extension/generate:POST", message: error.message, metadata: error.details });
        return NextResponse.json({ error: error.message, code: error.code, details: toClientErrorDetails(error) }, { status: error.status });
      }

      const billingSnapshot = userId
        ? await getBillingSnapshot(userId)
        : {
            plan: null,
            subscriptionStatus: null,
            hasActiveSubscription: false,
            renewalAt: null,
            availableCredits: 0,
            totalCredits: 0,
            usedCredits: 0,
            subscriptionLookupResult: {
              subscriptionFound: false,
              paymentFound: false,
              rawSubscriptionStatus: null,
              fallbackActive: false,
            },
          };
      serverLog({
        level: "warn",
        route: "/api/extension/generate:POST",
        message: error instanceof Error ? error.message : "Generate denied",
        metadata: {
          userId,
          toolId: requestedToolId,
          currentBalance: error instanceof ToolExecutionAccessError ? error.currentBalance : billingSnapshot.availableCredits,
          requiredCredits: error instanceof ToolExecutionAccessError ? error.requiredCredits : null,
          planId: billingSnapshot.plan,
          status: billingSnapshot.subscriptionStatus,
          credits: billingSnapshot.availableCredits,
          subscriptionLookupResult: billingSnapshot.subscriptionLookupResult,
          denialReason: error instanceof ToolExecutionAccessError ? (error.denialReason ?? error.code) : (error instanceof Error ? error.message : "unknown_error"),
          accessDeniedReason: error instanceof ToolExecutionAccessError ? error.code : (error instanceof Error ? error.message : "unknown_error"),
        },
      });

      if (error instanceof ToolExecutionAccessError) {
        const status = error.code === "COOLDOWN_ACTIVE" ? 429 : error.code === "TOOL_DISABLED" ? 423 : 402;
        return NextResponse.json(
          {
            success: false,
            error:
              error.code === "SUBSCRIPTION_REQUIRED"
                ? "An active subscription is required to run this tool."
                : error.code === "INSUFFICIENT_CREDITS"
                ? "You don't have enough credits for this generation."
                : error.message,
            code: error.code,
            details: {
              toolId: error.toolId,
              actualBalance: error.currentBalance,
              requiredCredits: error.requiredCredits,
              denialReason: error.denialReason ?? error.code,
            },
          },
          { status }
        );
      }

      return jsonApiError("We couldn't generate your output right now.", 400);
    }
  }, "We couldn't generate your output right now.");
}