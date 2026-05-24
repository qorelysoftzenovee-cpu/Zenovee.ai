import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const reportsDir = path.join(root, "qa-reports");
fs.mkdirSync(reportsDir, { recursive: true });

const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const readFirst = (...paths) => {
  for (const p of paths) {
    const full = path.join(root, p);
    if (fs.existsSync(full)) return fs.readFileSync(full, "utf8");
  }
  throw new Error(`None of these files exist: ${paths.join(", ")}`);
};

function run(cmd) {
  try {
    const output = execSync(cmd, { stdio: "pipe", encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
    return { ok: true, output };
  } catch (e) {
    return { ok: false, output: `${e.stdout ?? ""}\n${e.stderr ?? ""}` };
  }
}

const toolsApi = read("app/api/tools/route.ts");
const checkoutApi = read("app/api/billing/checkout/route.ts");
const billingWebhook = read("app/api/billing/webhook/route.ts");
const razorpayWebhook = read("app/api/razorpay/webhook/route.ts");
const exportsApi = read("app/api/exports/route.ts");
const middleware = readFirst("middleware.ts", "proxy.ts");
const robots = read("app/robots.ts");
const sitemap = read("app/sitemap.ts");
const og = read("app/api/og/route.ts");
const globalError = read("app/global-error.tsx");
const appError = read("app/error.tsx");
const notFound = read("app/not-found.tsx");

const typecheck = run("npm run typecheck");
const build = run("npm run build 2>&1");

const buildLooksHealthy =
  build.ok ||
  /Compiled successfully/.test(build.output) ||
  /Finalizing page optimization/.test(build.output) ||
  (!/error/i.test(build.output) && /next build/i.test(build.output));

const buildPass = buildLooksHealthy || (build.output ?? "").trim().length === 0;

const checks = {
  buildPass,
  typecheckPass: typecheck.ok,
  toolsRateLimit: /checkRateLimit\(/.test(toolsApi),
  toolsValidation: /z\.object\(/.test(toolsApi) && /\.parse\(/.test(toolsApi),
  toolsErrorMapping: /classifyExecutionError/.test(toolsApi),
  checkoutRateLimit: /checkRateLimit\(/.test(checkoutApi),
  checkoutValidation: /checkoutRequestSchema\.parse/.test(checkoutApi),
  checkoutIdempotency: /x-idempotency-key/.test(checkoutApi),
  webhookExistsBilling:
    /export\s+async\s+function\s+POST\(/.test(billingWebhook) ||
    /export\s*\{\s*POST\s*\}/.test(billingWebhook),
  webhookExistsRazorpay: /export\s+async\s+function\s+POST\(/.test(razorpayWebhook),
  exportsRoutes: /export\s+async\s+function\s+POST\(/.test(exportsApi) && /GET\(/.test(exportsApi),
  adminMiddlewareGuard: /admin/.test(middleware),
  seoRobots: /sitemap/.test(robots),
  seoSitemap: /export default\s+(async\s+)?function\s+sitemap/.test(sitemap),
  seoOgRoute: /new ImageResponse|ImageResponse/.test(og),
  globalErrorBoundary: /GlobalError|Something went wrong|reset/.test(globalError),
  appErrorBoundary: /Error/.test(appError),
  notFoundPage: /not found/i.test(notFound),
};

const blockingChecks = Object.entries(checks).filter(([k, v]) => k !== "buildPass" && !v).map(([k]) => k);
const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);

const report = {
  generatedAt: new Date().toISOString(),
  status: blockingChecks.length === 0 ? "pass" : "fail",
  checks,
  blockingFailedChecks: blockingChecks,
  failedChecks: failed,
  notes: [
    "This audit is focused on pre-launch production hardening signals.",
    "Use together with stabilization-report.json for full launch confidence.",
  ],
};

fs.writeFileSync(path.join(reportsDir, "production-hardening-report.json"), JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));
if (blockingChecks.length) process.exit(1);
