# Zenovee — RC Release Blocker Matrix

Last Updated: 2026-05-25

## Severity Definitions

### BLOCKER (Launch must stop)
- Broken payments (checkout/verification/webhooks failing)
- Broken auth (login/register/session/route protection failing)
- Broken tool execution (core generation unavailable)
- Broken exports (users cannot retrieve outputs)
- Runtime crashes (server or client crash loops)
- Security issues (auth bypass, secret leakage, privilege escalation)

### HIGH
- Major degraded UX on core paths with workaround
- Significant latency regressions on critical routes
- Admin controls partially broken
- Billing reconciliation inconsistencies without direct payment loss

### MEDIUM
- Non-critical page errors
- Intermittent visual/layout issues
- Non-core integration instability

### LOW
- Cosmetic issues
- Minor copy inconsistencies
- Nice-to-have polish gaps

---

## Current RC Status (Evidence-Based)

## BLOCKER
- **None currently confirmed from automated RC checks.**
- Evidence:
  - Stabilization pipeline summary: tool audit ✅, API contract ✅, smoke ✅, failed tools = 0
  - Fresh production build succeeded
  - Production hardening report shows no `blockingFailedChecks`

## HIGH
1. **Live payment canary not yet executed in production mode**
   - Risk: real gateway misconfiguration may be undetected.
   - Exit criteria: run ₹1 real transaction + webhook + refund verification.

2. **No completed full manual mobile matrix pass yet (iPhone/Android/tablet/laptop)**
   - Risk: device-specific UX regressions near launch.
   - Exit criteria: signed QA pass sheet for all target devices.

## MEDIUM
1. **`buildPass` field in production-hardening report is stale/false despite successful fresh build**
   - Risk: confusion in launch-go decision logs.
   - Exit criteria: re-run hardening audit immediately after build or tune audit script ordering.

2. **Synthetic production API uptime checks not yet wired as a recurring monitor**
   - Exit criteria: deploy external monitor on critical API endpoints.

## LOW
1. **Final visual polish sweep pending (spacing/contrast/copy consistency)**
2. **Post-launch SEO submission tasks pending (sitemap submission)**

---

## Release Gate

**Release may proceed to soft-launch only if:**
1. BLOCKER count = 0
2. HIGH items above are closed or explicitly accepted by release owner
3. Monitoring + rollback plan is documented and activated
