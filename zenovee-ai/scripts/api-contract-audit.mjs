import fs from "node:fs";
import path from "node:path";

const toolsApi = fs.readFileSync(path.join(process.cwd(), "app", "api", "tools", "route.ts"), "utf8");
const exportsApi = fs.readFileSync(path.join(process.cwd(), "app", "api", "exports", "route.ts"), "utf8");
const runnerUi = fs.readFileSync(path.join(process.cwd(), "components", "tools", "tool-runner.tsx"), "utf8");
const historyPage = fs.readFileSync(path.join(process.cwd(), "app", "history", "page.tsx"), "utf8");

const checks = {
  toolsPostRoute: /export\s+async\s+function\s+POST\(/.test(toolsApi),
  toolsGetRoute: /export\s+async\s+function\s+GET\(/.test(toolsApi),
  requestValidation: /executeToolSchema\.parse/.test(toolsApi),
  rateLimit: /checkRateLimit\(/.test(toolsApi),
  executionCall: /ToolExecutionService\.execute\(/.test(toolsApi),
  executionErrorMapping: /classifyExecutionError/.test(toolsApi),
  historyMode: /mode === "history"/.test(toolsApi),
  creditsMetrics: /creditsBefore/.test(toolsApi) && /creditsAfter/.test(toolsApi),

  exportsPostRoute: /export\s+async\s+function\s+POST\(/.test(exportsApi),
  exportsGetRoute: /export\s+async\s+function\s+GET\(/.test(exportsApi),
  exportsDeleteRoute: /export\s+async\s+function\s+DELETE\(/.test(exportsApi),
  exportCreate: /createExportForToolUsage/.test(exportsApi),
  exportSignedUrl: /getSignedExportForUser/.test(exportsApi),

  uiRunTool: /fetch\("\/api\/tools"/.test(runnerUi),
  uiHistoryLoad: /mode=history/.test(runnerUi),
  uiExportActions: /fetch\("\/api\/exports"/.test(runnerUi),
  uiExportFormats: /Export TXT/.test(runnerUi) && /Export MD/.test(runnerUi) && /Export PDF/.test(runnerUi) && /Export JSON/.test(runnerUi),

  historyServerPage: /from\("tool_usage"\)/.test(historyPage),
};

const pass = Object.values(checks).every(Boolean);
const report = { ...checks, pass };
console.log(JSON.stringify(report, null, 2));
if (!pass) process.exit(1);
