import { NextResponse } from "next/server";
import { ToolExecutionService } from "@/services/tool-execution-service";
import { getExtensionUser, getRequestIpAddress } from "@/lib/extension-auth";
import { AIProtectionError } from "@/services/ai/protection";
import { AIGenerationError, toClientErrorDetails } from "@/services/ai/prompt-orchestrator";
import { jsonApiError, withApiErrorHandling } from "@/lib/runtime";
import { serverLog } from "@/lib/logger";
import { getBillingSnapshot } from "@/lib/billing/credits";

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
      const creditsBefore = await ToolExecutionService.getCredits(user.id);
      const billingSnapshot = await getBillingSnapshot(user.id);
      serverLog({
        level: "info",
        route: "/api/extension/generate:POST",
        message: "Generate clicked",
        metadata: {
          userId: user.id,
          toolId,
          planId: billingSnapshot.plan,
          status: billingSnapshot.subscriptionStatus,
          credits: billingSnapshot.availableCredits,
          subscriptionLookupResult: billingSnapshot.subscriptionLookupResult,
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
          planId: billingSnapshot.plan,
          status: billingSnapshot.subscriptionStatus,
          credits: billingSnapshot.availableCredits,
          subscriptionLookupResult: billingSnapshot.subscriptionLookupResult,
          accessDeniedReason: error instanceof Error ? error.message : "unknown_error",
        },
      });

      return jsonApiError("We couldn't generate your output right now.", 400);
    }
  }, "We couldn't generate your output right now.");
}