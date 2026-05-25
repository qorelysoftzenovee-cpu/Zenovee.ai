# Zenovee — Final Production Release Checklist (RC)

Last Updated: 2026-05-25

## 1) Build & Artifact Health
- [x] `npm --prefix zenovee-ai run build` completes successfully.
- [x] TypeScript validation passes during build.
- [x] Route generation succeeds for app + API routes.
- [ ] Re-run production build in CI for release commit SHA and archive logs.

## 2) Environment Variables & Secret Hygiene
- [x] `.env.example` includes required production variables.
- [x] `lib/env.ts` enforces schema for core production env keys.
- [x] Billing env validation exists (`validateBillingEnv`).
- [x] AI env validation exists (`validateAiEnv`).
- [ ] Verify all production secrets are set only in Vercel/Supabase secret managers.
- [ ] Rotate pre-RC test secrets before public launch.

## 3) API Availability & Validation
- [x] API contract audit passes (`qa:api-contract`).
- [x] Request validation exists for tool execution + checkout.
- [x] Error mapping path exists for tool execution failures.
- [ ] Run live synthetic API ping checks against production URL.

## 4) Billing, Subscriptions & Razorpay
- [x] Checkout route has rate limiting + schema validation + idempotency key handling.
- [x] Razorpay webhook route(s) exist and are audited.
- [x] Billing webhook route exists and is audited.
- [ ] Perform live-mode ₹1 canary payment and refund verification.
- [ ] Verify subscription lifecycle events (create, renew, cancel) in prod DB.

## 5) Credits, Tools, Exports, History
- [x] Stabilization report shows 50 visible tools passed QA.
- [x] No broken exports/history saves/credit mismatches in stabilization report.
- [x] Smoke E2E passed in stabilization pipeline.
- [ ] Run manual canary: tool run -> credit decrement -> history save -> export download.

## 6) Database & Backend Reliability
- [x] Supabase-integrated auth/profile patterns active in guarded routes.
- [x] Migration stack exists for billing, tool execution, workspace governance, webhook hardening.
- [ ] Confirm production migration status (`supabase migration list` / dashboard equivalent).
- [ ] Verify database backups + PITR policy before launch.

## 7) Route Protection & Admin Safety
- [x] Proxy guard covers `/dashboard`, `/admin`, `/api/admin`, `/api/tools`, `/api/billing`.
- [x] Unauthorized/forbidden handling exists for admin API access.
- [x] Admin role normalization/sync path exists in auth service.
- [ ] Validate all admin pages with non-admin user in production.

## 8) SEO & Public Surface
- [x] `robots.ts`, `sitemap.ts`, OG route exist and pass hardening checks.
- [x] Static SEO pages are generated in production build output.
- [ ] Submit sitemap to search console post-launch.

## 9) Mobile & UX Release Pass
- [x] Playwright config includes mobile Chrome project (Pixel 7 profile).
- [ ] Execute full mobile manual pass (iPhone Safari, Android Chrome, tablet, laptop).
- [ ] Final visual QA for spacing, contrast, labels, CTA consistency.

## 10) Monitoring & Alerting
- [x] Error boundaries exist (`app/error.tsx`, `app/global-error.tsx`).
- [ ] Configure production alerts for: payments, webhook failures, generation failures, export failures, API 5xx, client crashes.
- [ ] Add dashboard widgets for success-rate + latency by route/tool.

## 11) Deployment & Rollback Readiness
- [ ] Confirm Vercel production env parity with staging.
- [ ] Validate production webhook URLs in Razorpay dashboard.
- [ ] Create rollback runbook: previous deployment restore + feature kill-switch strategy.
- [ ] Dry-run rollback once before opening to public users.

## 12) Soft Launch Controls
- [x] RC pipeline includes protective behavior for unstable tools (auto-hide in staging on failure).
- [ ] Define initial rollout cohort size and support SLA window.
- [ ] Enable enhanced logging window for first 72 hours.
