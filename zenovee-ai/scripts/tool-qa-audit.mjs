import fs from "node:fs";
import path from "node:path";

const registryPath = path.join(process.cwd(), "lib", "tools", "registry.ts");
const toolsApiPath = path.join(process.cwd(), "app", "api", "tools", "route.ts");
const exportsApiPath = path.join(process.cwd(), "app", "api", "exports", "route.ts");
const executionServicePath = path.join(process.cwd(), "services", "tool-execution-service.ts");
const src = fs.readFileSync(registryPath, "utf8");
const toolsApi = fs.readFileSync(toolsApiPath, "utf8");
const exportsApi = fs.readFileSync(exportsApiPath, "utf8");
const executionService = fs.readFileSync(executionServicePath, "utf8");

const categoryBlockMatch = src.match(/const idsByCategory:[\s\S]*?\};/);
if (!categoryBlockMatch) {
  console.error("❌ Could not locate idsByCategory block");
  process.exit(1);
}

const ids = [...categoryBlockMatch[0].matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
const uniqueIds = Array.from(new Set(ids));

const expectedTotal = 54; // 50 premium + 4 browser internal
const expectedPremium = 50;
const hasExpectedCount = uniqueIds.length === expectedTotal;
const hasExpectedPremiumCount = /filter\(\(\[category\]\) => category !== TOOL_CATEGORIES\.BROWSER_TOOLS\)/.test(src);

const hasExportFormats = /exportFormats:\s*\["txt",\s*"md",\s*"pdf",\s*"json"\]/.test(src);
const hasPublicFiltering = /getPublicToolDefinitions\s*=\s*\(\)\s*=>\s*premiumToolDefinitions/.test(src);
const hasInputSchema = /inputSchema:/.test(src);
const hasOutputSchema = /outputSchema:/.test(src);
const hasPromptTemplate = /promptTemplate:/.test(src);
const hasOutputFormatter = /outputFormatter:/.test(src);

const hasRateLimit = /checkRateLimit\(/.test(toolsApi);
const hasHistoryMode = /mode === "history"/.test(toolsApi);
const hasExportRoute = /createExportForToolUsage/.test(exportsApi) && /getSignedExportForUser/.test(exportsApi);

const hasValidation = /tool\.inputSchema\.parse/.test(executionService);
const hasRetries = /totalAttempts/.test(executionService) && /isTransientError/.test(executionService);
const hasRollback = /refund_user_credits/.test(executionService);
const hasUsageLogs = /tool_usage_logs/.test(executionService) && /tool_usage/.test(executionService);
const hasAbuseProtection = /AIProtectionService\.validateBeforeGeneration/.test(executionService);
const hasIdempotency = /idempotency_key/.test(executionService);

const report = {
  totalIdsFound: uniqueIds.length,
  expectedTotal,
  expectedPremium,
  hasExpectedCount,
  hasExpectedPremiumCount,
  hasExportFormats,
  hasPublicFiltering,
  hasInputSchema,
  hasOutputSchema,
  hasPromptTemplate,
  hasOutputFormatter,
  hasRateLimit,
  hasHistoryMode,
  hasExportRoute,
  hasValidation,
  hasRetries,
  hasRollback,
  hasUsageLogs,
  hasAbuseProtection,
  hasIdempotency,
  pass:
    hasExpectedCount &&
    hasExpectedPremiumCount &&
    hasExportFormats &&
    hasPublicFiltering &&
    hasInputSchema &&
    hasOutputSchema &&
    hasPromptTemplate &&
    hasOutputFormatter &&
    hasRateLimit &&
    hasHistoryMode &&
    hasExportRoute &&
    hasValidation &&
    hasRetries &&
    hasRollback &&
    hasUsageLogs &&
    hasAbuseProtection &&
    hasIdempotency,
};

console.log(JSON.stringify(report, null, 2));

if (!report.pass) {
  process.exit(1);
}
