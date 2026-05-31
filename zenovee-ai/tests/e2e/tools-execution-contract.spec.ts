import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const API_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://127.0.0.1:3000";
const PROJECT_ROOT = path.resolve(process.cwd(), "zenovee-ai");

async function isServerReachable(url: string) {
  try {
    const response = await fetch(url, { method: "GET" });
    return response.status > 0;
  } catch {
    return false;
  }
}

test.describe("Tools API execution contract", () => {
  test("returns safe error envelope on unauthenticated request", async ({ request }) => {
    test.skip(!(await isServerReachable(API_BASE_URL)), `Server not reachable at ${API_BASE_URL}`);

    const response = await request.post(`${API_BASE_URL}/api/tools`, {
      data: {
        toolId: "seo-article-generator",
        input: { topic: "test" },
      },
    });

    expect(response.status()).toBe(401);
    const json = await response.json();
    expect(json).toHaveProperty("success", false);
    expect(String(json.error ?? "").toLowerCase()).toContain("unauthorized");
  });

  test("uses canonical billing snapshot for entitlement fallback and generate logging", async () => {
    const billingCredits = fs.readFileSync(path.join(PROJECT_ROOT, "lib", "billing", "credits.ts"), "utf8");
    const executionService = fs.readFileSync(path.join(PROJECT_ROOT, "services", "tool-execution-service.ts"), "utf8");
    const toolsRoute = fs.readFileSync(path.join(PROJECT_ROOT, "app", "api", "tools", "route.ts"), "utf8");
    const extensionRoute = fs.readFileSync(path.join(PROJECT_ROOT, "app", "api", "extension", "generate", "route.ts"), "utf8");

    expect(billingCredits).toMatch(/fallbackActive\s*=\s*Boolean\(resolvedPlan\)\s*&&\s*hasSuccessfulPayment/);
    expect(billingCredits).toMatch(/hasActiveSubscription:\s*effectiveStatus\s*===\s*"ACTIVE"\s*\|\|\s*effectiveStatus\s*===\s*"PAST_DUE"/);
    expect(billingCredits).toMatch(/export\s+async\s+function\s+canUseTool[\s\S]*getBillingSnapshot\(userId\)/);
    expect(billingCredits).toMatch(/balanceSource:\s*"user_credits"\s*\|\s*"plan_inference"/);
    expect(billingCredits).toMatch(/availableCredits:\s*inferredAvailableCredits/);

    expect(executionService).toMatch(/const toolAccess = await canUseTool\(args\.userId, tool\.id\)/);
    expect(executionService).not.toMatch(/from\("subscriptions"\)[\s\S]*select\("status,grace_until"\)/);
    expect(executionService).toMatch(/throw new ToolExecutionAccessError\(/);
    expect(executionService).toMatch(/balanceSource: toolAccess\.billing\.balanceSource/);

    expect(toolsRoute).toMatch(/message:\s*"Generate clicked"/);
    expect(toolsRoute).toMatch(/currentBalance/);
    expect(toolsRoute).toMatch(/requiredCredits/);
    expect(toolsRoute).toMatch(/denialReason/);
    expect(toolsRoute).toMatch(/balanceSource/);
    expect(toolsRoute).toMatch(/subscriptionSource/);
    expect(extensionRoute).toMatch(/message:\s*"Generate clicked"/);
    expect(extensionRoute).toMatch(/currentBalance/);
    expect(extensionRoute).toMatch(/requiredCredits/);
    expect(extensionRoute).toMatch(/denialReason/);
    expect(extensionRoute).toMatch(/balanceSource/);
    expect(extensionRoute).toMatch(/subscriptionSource/);
  });
});
