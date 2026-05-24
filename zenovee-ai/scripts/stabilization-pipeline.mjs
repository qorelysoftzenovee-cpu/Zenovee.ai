import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const reportsDir = path.join(root, "qa-reports");
const envPath = path.join(root, ".env");
const registryPath = path.join(root, "lib", "tools", "registry.ts");

fs.mkdirSync(reportsDir, { recursive: true });

function runCommand(command, outputFile) {
  try {
    const output = execSync(command, { stdio: "pipe", encoding: "utf8" });
    if (outputFile) fs.writeFileSync(outputFile, output, "utf8");
    return { ok: true, output };
  } catch (error) {
    const output = `${error?.stdout ?? ""}\n${error?.stderr ?? ""}`;
    if (outputFile) fs.writeFileSync(outputFile, output, "utf8");
    return { ok: false, output };
  }
}

function getVisibleToolIds() {
  const src = fs.readFileSync(registryPath, "utf8");
  const block = src.match(/const idsByCategory:[\s\S]*?\};/)?.[0] ?? "";
  const ids = [...block.matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);
  return Array.from(new Set(ids)).filter((id) => !id.startsWith("browser-"));
}

function updateHiddenTools(hiddenIds) {
  if (!fs.existsSync(envPath)) return;
  const env = fs.readFileSync(envPath, "utf8");
  const line = `NEXT_PUBLIC_HIDDEN_TOOL_IDS=${hiddenIds.join(",")}`;
  if (/^NEXT_PUBLIC_HIDDEN_TOOL_IDS=.*$/m.test(env)) {
    fs.writeFileSync(envPath, env.replace(/^NEXT_PUBLIC_HIDDEN_TOOL_IDS=.*$/m, line), "utf8");
  } else {
    fs.writeFileSync(envPath, `${env.trim()}\n${line}\n`, "utf8");
  }
}

const visibleToolIds = getVisibleToolIds();

const toolAudit = runCommand("node scripts/tool-qa-audit.mjs", path.join(reportsDir, "tool-audit.json"));
const apiAudit = runCommand("node scripts/api-contract-audit.mjs", path.join(reportsDir, "api-contract.json"));
const e2eSmoke = runCommand(
  "npx playwright test tests/e2e/tools-smoke.spec.ts --workers=1 --reporter=json",
  path.join(reportsDir, "playwright-smoke.json")
);

const unstableTools = [];
if (!toolAudit.ok || !apiAudit.ok || !e2eSmoke.ok) {
  // Safe staging behavior: hide all visible premium tools if global QA fails.
  unstableTools.push(...visibleToolIds);
  updateHiddenTools(unstableTools);
}

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    toolAuditPassed: toolAudit.ok,
    apiAuditPassed: apiAudit.ok,
    smokePassed: e2eSmoke.ok,
    visibleToolsCount: visibleToolIds.length,
    unstableToolsCount: unstableTools.length,
  },
  passedTools: unstableTools.length === 0 ? visibleToolIds : [],
  failedTools: unstableTools,
  slowTools: [],
  malformedOutputs: [],
  brokenExports: [],
  brokenHistorySaves: [],
  creditMismatches: [],
  notes: [
    "Global QA pipeline is fully automated.",
    "If any critical QA stage fails, visible tools are auto-hidden in staging via NEXT_PUBLIC_HIDDEN_TOOL_IDS.",
  ],
};

fs.writeFileSync(path.join(reportsDir, "stabilization-report.json"), JSON.stringify(report, null, 2), "utf8");

if (!toolAudit.ok || !apiAudit.ok || !e2eSmoke.ok) {
  console.error("Stabilization pipeline failed. See qa-reports/ for details.");
  process.exit(1);
}

console.log("Stabilization pipeline passed. Report: qa-reports/stabilization-report.json");
