# Phase 3: Testing & Documentation Review

---

## Test Coverage Findings

### CRITICAL

**C1 — Cross-tenant isolation is completely untested (and currently impossible to test — RLS is disabled)**
Files: `src/app/actions/findings.ts`, `src/app/actions/reports.ts`, `src/app/actions/templates.ts`
There are zero tests verifying that user A cannot access user B's data. This is not merely a test gap — because all data access runs via the service-role key with hand-written `.eq('user_id', user.id)` clauses, the only way to test isolation is to mock `adminDb()` and assert the correct filter is applied. Until RLS is enabled (Security Phase 2, C1), any test of isolation is testing implementation, not enforcement. Fix: add mockAdminDb factory; write isolation tests per action; enable RLS before trusting the test results.

**C2 — Free-tier finding cap is advertised, unenforced, and untested**
File: `src/app/actions/findings.ts`
`createFinding` has no limit check. Terms of Service and marketing page promise "10 findings per report" for free users. No test confirms the 11th finding is rejected. Fix: implement the limit; add a unit test asserting `createFinding` returns an error on the 11th call for a free user.

**C3 — Stripe webhook has zero tests — no signature verification test, no idempotency test, no event handler test**
File: `src/app/api/stripe/webhook/route.ts`
The webhook is the billing backbone. No test exists for: (a) signature verification rejecting invalid payloads, (b) duplicate event delivery writing duplicate upserts, (c) `checkout.session.completed` → subscription created, (d) `customer.subscription.deleted` → subscription cancelled, (e) `invoice.payment_failed` (currently unhandled). Example test skeleton:
```ts
import { stripe } from '@/lib/stripe'
const body = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed', ... })
const sig = stripe.webhooks.generateTestHeaderString({ payload: body, secret: 'whsec_test' })
const res = await POST(new Request('/', { method: 'POST', body, headers: { 'stripe-signature': sig } }))
expect(res.status).toBe(200)
```

**C4 — `deleteAccount` failure modes completely untested**
File: `src/app/actions/settings.ts`
No test covers: (a) Stripe cancel throws → data not deleted; (b) DB deletion partial failure; (c) double-submit race; (d) `deleteUser` throws after cookies cleared. This is the most destructive action in the app and has zero test coverage.

**C5 — PDF export route completely untested — no timeout test, no finding cap test, no auth test**
File: `src/app/(app)/reports/[id]/export/route.tsx`
No test confirms: 201 findings returns 413; render timeout returns 504; unauthenticated request returns 401; Pro gate rejects free users. Without a finding cap and timeout implemented (Security C5/Performance C1), a test confirming the 413 boundary is also the production guard.

---

### HIGH

**H1 — No CI pipeline — `pnpm test`, `pnpm build`, `pnpm lint` never run automatically**
There is no `.github/workflows/` directory. Tests, TypeScript type-checking, lint, and dependency audit are never automated. A broken build or a new security vulnerability in a dependency can reach the main branch and production silently. Fix: create `.github/workflows/ci.yml` with build + test + lint + `pnpm audit --audit-level=high` jobs on push to main and all PRs.

**H2 — No test infrastructure for server actions — no mockAdminDb, no mockAuth, no Next.js navigation mock**
None of the server actions can currently be unit-tested without a real Supabase connection. There is no:
- `mockAdminDb()` factory that returns a Supabase client mock
- `mockAuth(userId)` helper that stubs `auth.getUser()`
- `vi.mock('next/navigation')` for `redirect()` calls in server actions
Fix: create `src/lib/__tests__/helpers/` with reusable test factories.

**H3 — Existing tests cover only pure utility functions — zero server action, zero API route, zero component tests**
The 2 existing test files (`utils.test.ts`, `templates.test.ts`) test `deriveSeverity()` and `CURATED_TEMPLATES` — both pure functions with no side effects and no dependencies. Every server action, every API route, and every React component is completely untested. This represents approximately 2% test coverage of the meaningful application surface.

**H4 — No integration tests for the auth flow — login, signup, session, callback**
`src/components/auth/auth-form.tsx` calls `signInWithPassword` and `signUp` client-side. No test verifies: successful login sets session; failed login shows error; signup with existing email shows appropriate message; email confirmation flow redirects correctly (also blocked by missing `/auth/callback` route, Documentation C4).

**H5 — No test for the free-tier report limit race condition (TOCTOU)**
File: `src/app/actions/reports.ts`
Two concurrent `createReport` calls at count 2 both pass the check and both succeed, creating 4 reports for a free user. No test covers concurrent submission. Fix: add a test using `Promise.all([createReport(...), createReport(...)])` with a free user at count 2 and assert only one succeeds.

---

### MEDIUM

**M1** — `vitest.config.ts` uses `environment: 'node'` only — no `jsdom` environment for component tests
**M2** — No coverage reporting configured — `vitest --coverage` not in any script, no threshold enforced
**M3** — No test for `camel<T>()` type coercion — the unsound type cast and auto-Date regex are untested
**M4** — No test for `getSubscription` — Pro vs free gate is untested; any refactor can silently break billing
**M5** — No test for the template apply + overwrite flow — `applyTemplate` silently overwrites user draft
**M6** — No snapshot or accessibility tests for any component — `FindingForm`, `FindingCard`, PDF document all untested
**M7** — No test for `assertReportOwner` — ownership check that guards all finding mutations is untested
**M8** — No load/stress test for PDF export — a single test confirming render completes in < 5s with 50 findings would provide a regression baseline

---

### LOW

L1 — `vitest.config.ts` does not exclude `node_modules` from coverage — default includes dependency test files in coverage reports
L2 — No `@vitest/ui` or HTML reporter configured — test results not browseable without console
L3 — No test for `cn()` / `tailwind-merge` integration — not critical but used in every component
L4 — Test files lack `beforeEach` cleanup — shared state between `it()` blocks could cause order-dependent failures if server action mocks are added

---

## Documentation Findings

### CRITICAL

**C1 — Privacy Policy does not disclose Sentry as a sub-processor (GDPR Art. 13, Art. 28)**
File: `src/app/privacy/page.tsx`, Section 4
Section 4 lists Supabase, Stripe, and Vercel as sub-processors. Sentry is absent despite being an active data processor: `instrumentation-client.ts` confirms Session Replay at `replaysSessionSampleRate: 0.05` and `replaysOnErrorSampleRate: 1.0`, sending session recordings and potentially pentest evidence blobs to `*.ingest.sentry.io`. The CSP explicitly allows `connect-src https://*.ingest.sentry.io`, confirming real data flows. For a SaaS storing confidential pentest data, this is especially material — security-professional customers inspect privacy pages before storing client data.

Fix: Add to Section 4: *"Sentry (Functional Software Inc., USA) — error monitoring and session replay. Sentry is SOC 2 Type II certified. Data may be transferred to the USA under Standard Contractual Clauses. Replay recordings mask all text and block all media by default."*

**C2 — Terms of Service advertises "10 findings per report" free-tier limit — not enforced in code**
Files: `src/app/terms/page.tsx` §6, `src/app/page.tsx` pricing, `src/app/actions/findings.ts`
ToS §6 and the landing page pricing table both promise "10 findings per report" for free users. `createFinding` has no enforcement. This is both a contract inaccuracy and a security/DoS vector (Security C6). Fix: either implement the 10-finding limit in `createFinding`, or remove the claim from ToS and landing page.

**C3 — `deleteAccount` has no data export step before deletion — GDPR Art. 20 non-compliance**
File: `src/app/actions/settings.ts` lines 49–96
The Privacy Policy §6 commits to data portability. `deleteAccount` immediately cancels Stripe, deletes all data, and calls `deleteUser` with no export step or grace period. Fix: implement a data export (JSON download or email) as step 1 of a two-step deletion flow; update the privacy policy to specify the mechanism.

**C4 — No `/auth/callback` route — email confirmation flow is broken or undocumented**
No `/auth/callback` route exists anywhere in `src/app/`. Supabase email confirmation links redirect to `<site_url>/auth/callback?code=<code>` by default. Without this route, clicking a confirmation link results in a Next.js 404. Either email confirmation is disabled in Supabase (undocumented security choice) or signups are broken. Fix: create `src/app/auth/callback/route.ts` with PKCE code exchange; document Supabase redirect URL configuration in README.

**C5 — No CI/CD pipeline — security checks, type safety, and tests are not automated**
No `.github/workflows/` directory exists. `pnpm test`, `pnpm build`, `pnpm lint`, `pnpm audit`, and secret scanning (`gitleaks`) never run automatically. A broken TypeScript build or a leaked secret can reach production silently. Fix: create `.github/workflows/ci.yml` with build + test + lint + audit + gitleaks jobs.

---

### HIGH

**H1 — README missing deployment guide, environment variable descriptions, and architecture overview**
File: `README.md`
Missing: (1) full env var table with descriptions and sources; (2) Vercel deployment guide (env vars, Stripe webhook registration, Supabase redirect URL); (3) architecture explanation for the dual-client pattern (`createClient()` vs `adminDb()`); (4) distinction between `db:push` (dev) vs `db:migrate` (production); (5) Sentry setup instructions. `SENTRY_AUTH_TOKEN` is absent from `.env.local.example` entirely.

**H2 — `SENTRY_AUTH_TOKEN` and `NEXT_PUBLIC_SENTRY_DSN` absent from `.env.local.example`**
Files: `.env.local.example`, `next.config.ts`
Without these in the example file, a developer setting up the project will have a broken Sentry integration — source maps won't upload, stack traces will be minified. Add both to `.env.local.example` with comments indicating `SENTRY_AUTH_TOKEN` is build-time only (Vercel build env var, not exposed at runtime).

**H3 — No `/.well-known/security.txt` (RFC 9116)**
File: `public/` (missing)
SECURITY.md exists and is well-written. RFC 9116 is now a formal standard — security researchers check `/.well-known/security.txt` before deciding how to report. Fix: create `public/.well-known/security.txt` with `Contact:`, `Expires:`, `Policy:`, and `Preferred-Languages:` fields.

**H4 — Landing page advertises "AI-assisted recommendations" — feature does not exist**
File: `src/app/page.tsx` line 111
Features grid item 06 ("Smart Suggestions") and the Pro pricing tier both advertise AI-assisted recommendations. No AI integration exists anywhere in the codebase. Advertising a non-existent paid feature (Pro is £49/month) is a consumer protection issue under UK Consumer Rights Act 2015. Fix: remove or mark "Coming Soon" before launch.

**H5 — Drizzle vs Supabase migration split undocumented — `db:push` vs `db:migrate` confusion**
File: `drizzle.config.ts`, `README.md`
`drizzle.config.ts` outputs to `./supabase/migrations`, which conflicts with Supabase CLI migration files. The README only documents `db:push`. A developer who runs `db:push` in production bypasses migration history; `db:migrate` may conflict with manually created Supabase migrations. No ADR explains the dual-stack architecture decision. Fix: document in an ADR; clarify which migration command to use in which context.

---

### MEDIUM

**M1** — GDPR data portability right requires manual email — no self-service export (`privacy/page.tsx` §6)
**M2** — Free-tier PDF export contradiction: landing page says Free, code says Pro-only (`page.tsx` vs `reports/[id]/page.tsx`)
**M3** — `deriveSeverity()` has no JSDoc citing CVSS v3.1 NVD thresholds — critical for pentest professional audience (`lib/utils.ts`)
**M4** — Stripe webhook route has no comment listing required Stripe dashboard event subscriptions (`api/stripe/webhook/route.ts`)
**M5** — No ADR or TODO comment explaining the `adminDb()` interim pattern and RLS bypass — will be replicated in new features (all `actions/*.ts`)
**M6** — No operational runbook — secret rotation, Stripe webhook re-registration, migration rollback undocumented
**M7** — `docs/` contains only internal agentic work plans — no operator documentation, ADRs, or architecture overview

---

### LOW

L1 — README emoji section headers undercut enterprise positioning for a product marketed to professional pen testers
L2 — Privacy policy §8 claims "row-level security" is active — currently false (RLS is disabled; see Security C1)
L3 — No `sitemap.ts` or `robots.ts` — authenticated app routes not blocked at HTTP level, no sitemap served
L4 — `LICENSE.md` does not acknowledge open-source dependency licenses — relevant for enterprise due diligence

---

## Critical Issues for Phase 4 Context

1. **No CI pipeline** — framework best practices review must include a CI/CD pipeline implementation recommendation specific to Next.js 16 + Vercel deployment
2. **Zero server action tests** — best practices review must address the Vitest + Next.js testing pattern (how to mock `next/headers`, `next/navigation`, and server-only modules)
3. **Privacy policy false claim about RLS** — this feeds directly back into the security gap (enabling RLS resolves both the security finding and the documentation inaccuracy simultaneously)
4. **Missing `/auth/callback` route** — this is a deployment gap that CI would catch via E2E tests, and a documentation gap that a deployment guide would prevent
5. **AI feature advertised but not implemented** — must be resolved before launch as it affects the Pro pricing tier and constitutes a consumer protection risk
