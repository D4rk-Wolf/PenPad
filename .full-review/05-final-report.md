# PenPad — Comprehensive Production Readiness Review
**Review Date:** 2026-05-28 | **Target Go-Live:** 2026-06-05 | **Days Remaining:** 8

---

## Executive Summary

PenPad is a well-structured, thoughtfully designed SaaS product with a clear value proposition and a coherent technology stack. The UI and product experience are strong. However, **the codebase is not production-ready for a June 5 go-live in its current state.**

The review identified **192 findings across 8 categories**: 34 Critical, 51 High, 64 Medium, 43 Low. Of the 34 Critical findings, **16 are launch blockers** — issues that would cause an immediate legal violation, a broken core flow, a security incident, or a system crash under normal production load.

The most severe cluster: **all authentication middleware is inert** (a missing `middleware.ts` file means `proxy.ts` never executes), **Row Level Security is disabled across the entire database** (tenants are isolated only by hand-written TypeScript clauses), and **three pages of legal text advertise features or guarantees that the code does not implement** (a GDPR violation, a contract inaccuracy, and a UK consumer protection issue).

**Go/No-Go Assessment: CONDITIONAL NO-GO.**
With focused effort, 6–8 of the 16 launch blockers can be resolved in 3–4 days. The remaining blockers — primarily RLS enablement, Stripe webhook hardening, and the CI pipeline — require an additional 2–3 days. An 8-day window is tight but achievable if work begins immediately and is scoped to the blocker list only.

---

## Findings by Priority

### P0 — Launch Blockers (Fix Before Any Production Traffic)

These 16 issues would cause immediate legal violations, broken core flows, security incidents, or production outages. The product must not serve real users until each is resolved or explicitly risk-accepted with a documented mitigation.

---

#### P0-1 — `middleware.ts` is missing — all app routes are completely unprotected at the edge
**Source:** Framework C1
**File:** `src/proxy.ts` (exists but is never executed); `src/middleware.ts` (missing)
`src/proxy.ts` implements auth route-guards and session-cookie refresh, but Next.js only executes a file named exactly `middleware.ts` (or `.js`) in the `src/` root. The proxy is dead code. Every route under `/(app)/` — dashboard, reports, settings, templates — is currently reachable without authentication at the edge level. The `(app)/layout.tsx` server-component auth check provides a soft redirect-on-render, but direct API calls, prefetch requests, and any future route handler bypass it entirely.

**Fix (30 minutes):** Create `src/middleware.ts`:
```ts
export { proxy as middleware, config } from '@/proxy'
```
Verify `proxy.ts` exports both the handler and a `config` object with `matcher`.

---

#### P0-2 — `experimental.serverActions` is obsolete in Next.js 16 — CSRF origin protection is silently disabled
**Source:** Framework C2
**File:** `next.config.ts`
`allowedOrigins` is nested under `experimental.serverActions`, which was only valid in Next.js 13. In Next.js 16 this key is silently ignored, meaning cross-origin CSRF protection for all Server Actions is not enforced. Any website can trigger Server Actions (form submissions, data mutations) on behalf of authenticated users.

**Fix (15 minutes):**
```ts
const nextConfig: NextConfig = {
  serverActions: {
    allowedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? ''].filter(Boolean),
  },
}
```

---

#### P0-3 — Row Level Security is disabled — multi-tenant isolation relies entirely on hand-written TypeScript
**Source:** Security C1, Architecture C1
**Files:** `src/lib/supabase/admin.ts`, all four `src/app/actions/*.ts`
Every database operation — for every user — runs as the Postgres superuser via the Supabase service-role key. RLS is entirely inactive. Data isolation is enforced only by `.eq('user_id', user.id)` clauses in TypeScript server actions. One missed clause (or a future action that omits it) results in a full multi-tenant data breach. The landing page claims "secure by default / row-level security" — this is materially false today.

**Fix:** Enable RLS on all four tables and create policies (SQL in Security C1). Switch user-scoped CRUD operations from `adminDb()` to the SSR user client `createClient()`. Retain `adminDb()` only for the Stripe webhook and `auth.admin.deleteUser`.

---

#### P0-4 — No `/auth/callback` route — email confirmation signup flow is broken
**Source:** Documentation C4
**File:** `src/app/auth/callback/` (missing)
Supabase email confirmation links redirect to `<site_url>/auth/callback?code=<code>`. No such route exists. Clicking the confirmation link returns a Next.js 404. Either email confirmation is silently disabled in the Supabase project (an undocumented security decision) or new user signups are broken.

**Fix:** Create `src/app/auth/callback/route.ts`:
```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```
Add `<NEXT_PUBLIC_APP_URL>/auth/callback` to the Supabase "Redirect URLs" allowlist.

---

#### P0-5 — Privacy policy violates GDPR Art. 13/28 — Sentry not disclosed as sub-processor
**Source:** Documentation C1, Architecture C3, Security H1
**File:** `src/app/privacy/page.tsx`
Sentry is processing user session data (via Session Replay at 5% sample rate and 100% on errors), stack traces, and potentially pentest evidence blobs — yet Sentry is absent from Section 4 ("Third-party services"). This is a GDPR Art. 13 transparency failure and an Art. 28 sub-processor documentation gap. For a SaaS storing confidential pentest data, security-professional customers will inspect the privacy page before trusting it with client data.

**Fix:** Add Sentry to Section 4. Additionally: gate `replayIntegration()` initialization behind consent rather than initialising unconditionally in `instrumentation-client.ts`.

---

#### P0-6 — Privacy policy Section 8 falsely claims "row-level security" is active
**Source:** Documentation L2
**File:** `src/app/privacy/page.tsx`
Section 8 states: *"We apply row-level security so users can only access their own data."* RLS is disabled (P0-3). This is a false statement of fact in a legal document.

**Fix:** Either enable RLS (which resolves both P0-3 and this finding simultaneously), or reword Section 8 pending RLS enablement: *"We enforce user-level data isolation through server-side access controls on every query."*

---

#### P0-7 — ToS and landing page advertise a free-tier finding limit (10/report) that is not enforced
**Source:** Documentation C2, Security C6
**Files:** `src/app/terms/page.tsx` §6, `src/app/page.tsx` pricing, `src/app/actions/findings.ts`
The Terms of Service and the landing page pricing table both state "10 findings per report" for free users. `createFinding` has no enforcement. This is a contract inaccuracy (Terms state a limit the product doesn't enforce) and a DoS vector (free users can store unlimited findings, triggering unbounded PDF renders).

**Fix:** Either implement the limit (`FREE_FINDING_LIMIT = 10` check in `createFinding` before insert) or remove the claim from ToS §6 and the landing page. Option A is strongly preferred.

---

#### P0-8 — Landing page advertises "AI-assisted recommendations" as a Pro feature — does not exist
**Source:** Documentation H4
**File:** `src/app/page.tsx`
Features grid item 06 and the Pro pricing card (£49/month) both advertise AI-assisted recommendations. No AI integration exists anywhere in the codebase. Advertising a non-existent paid feature is a consumer protection issue under UK Consumer Rights Act 2015.

**Fix:** Remove "Smart Suggestions / AI-assisted recommendations" from both the features grid and the Pro feature list before launch. If planned post-launch, add a "Coming soon" label.

---

#### P0-9 — PDF export availability contradicts between landing page (Free) and code (Pro-only)
**Source:** Documentation M2
**Files:** `src/app/page.tsx` pricing, `src/app/(app)/reports/[id]/page.tsx`
The landing page free tier lists "PDF export" as included. The report page gates the Export button behind `isPro`. Either the feature gate or the marketing copy is wrong.

**Fix:** Audit the authoritative feature matrix and make it consistent across (1) landing page, (2) Terms §6, (3) the server-side gate. Update whichever is wrong.

---

#### P0-10 — Stripe webhook non-idempotent; `invoice.payment_failed` unhandled; users keep Pro on failed payment
**Source:** Security C3, Code Quality C3, Architecture H3
**File:** `src/app/api/stripe/webhook/route.ts`
No event-ID deduplication — duplicate Stripe retries write duplicate upserts. Out-of-order delivery can overwrite subscription cancellation with active status. `invoice.payment_failed` is unhandled — users retain Pro access indefinitely after payment failure.

**Fix:** Add a `stripe_events_processed(id text primary key)` dedup table; check + insert atomically with the subscription upsert. Add `invoice.payment_failed` and `customer.subscription.paused` handlers.

---

#### P0-11 — `deleteAccount` non-atomic — Stripe cancel errors are swallowed; billing survives deletion
**Source:** Security C4, Code Quality C2
**File:** `src/app/actions/settings.ts` lines 49–96
Stripe cancel exception is caught and discarded. If Stripe is down when a user deletes their account, all user data is destroyed while billing continues. Five non-transactional DB deletions — any partial failure leaves orphan data. Cookies are cleared before `deleteUser`, so if `deleteUser` throws, the user is signed out but their account remains.

**Fix:** Fail-closed on Stripe cancel (throw if cancel fails — do not proceed with data deletion). Wrap DB deletions in a Postgres SECURITY DEFINER function for atomicity.

---

#### P0-12 — PDF export has no timeout and no finding cap — authenticated user can DoS the server
**Source:** Security C5, Performance C1
**File:** `src/app/(app)/reports/[id]/export/route.tsx`
No timeout, no finding cap, no concurrency limit. Combined with no input length caps (P1-2), a Pro user can allocate 200–600 MB per render call. Multiple concurrent renders from one user exhaust Vercel Lambda RAM. Vercel default timeout is 10–15s; a render can take 30–60s.

**Fix:** `MAX_FINDINGS = 200`, `Promise.race(render, timeout(30_000))`, `vercel.json` with `maxDuration: 60`. Also create `vercel.json` immediately to prevent the default timeout from terminating even valid renders.

---

#### P0-13 — No CI/CD pipeline — broken builds and secrets can reach production undetected
**Source:** CI/CD C1, Documentation C5
No `.github/` directory. Every push to `main` auto-deploys via Vercel. TypeScript errors, test failures, lint violations, and leaked secrets have no automated gate.

**Fix:** Create `.github/workflows/ci.yml` with: gitleaks secret scan → pnpm audit → tsc + lint + test → Vercel preview deploy (PRs) → Vercel production deploy (main, after all gates pass). Full YAML template in the CI/CD review.

---

#### P0-14 — Supabase direct connection in production — will exhaust connection limit under moderate load
**Source:** CI/CD C3
**Files:** `src/lib/db/index.ts`, `.env.local.example`
`.env.local.example` uses the "direct url" for `DATABASE_URL`. Direct connections (port 5432) create a new Postgres connection per Vercel Function invocation. Under moderate load, this hits Supabase's connection limit (~60) and returns `too many clients` errors for all users.

**Fix:** Set `DATABASE_URL` to the Supavisor pooler URL (port 6543, transaction mode) for all application runtime queries. Add `DATABASE_URL_DIRECT` (port 5432) for Drizzle migrations only. Update `.env.local.example` to document both.

---

#### P0-15 — PDF export route will hit Vercel Function timeout — no `vercel.json` `maxDuration`
**Source:** CI/CD H2
**File:** `src/app/(app)/reports/[id]/export/route.tsx`
Vercel Pro default timeout is 15s. `@react-pdf/renderer` can take 30–60s on a full report. Users will receive a `504 Gateway Timeout` with no error message.

**Fix:** Create `vercel.json`:
```json
{
  "functions": {
    "src/app/(app)/reports/[id]/export/route.tsx": { "maxDuration": 60 },
    "src/app/api/stripe/webhook/route.ts": { "maxDuration": 30 }
  }
}
```
Verify the Vercel project is on the Pro plan (required for `maxDuration > 10`).

---

#### P0-16 — No database migration step before deploy — schema/code can diverge on every release
**Source:** CI/CD C2
`pnpm db:migrate` is never called automatically. A deploy that references a new schema column before the migration runs causes immediate production errors.

**Fix:** Add a `migrate` job to the CI workflow that runs `pnpm db:migrate` with `DATABASE_URL_DIRECT` before the production deploy job. Make `deploy-production` depend on `migrate`.

---

### P1 — Fix Before First Paying Customer (High Priority)

These issues don't immediately break core flows but represent significant security, financial, or reliability risks that should be resolved in the days following launch.

| ID | Category | Finding |
|---|---|---|
| Security H1 | Security | Sentry Session Replay fires on anonymous visitors pre-consent |
| Security H2 | Security | No rate limiting on login, signup, PDF export, or password change |
| Security H3 | Security | Service-role key available to all server modules; no key minimisation |
| Security H4 | Security | CSP `'unsafe-inline'` on `script-src` negates XSS hardening |
| Security H5 | Security | Stripe checkout/portal `success_url` built from env var without origin validation (open redirect) |
| Security H6 | Security | Auth runs entirely client-side; no MFA, no server-side audit log |
| Security H7 | Security | Stripe webhook userId not cross-checked against customer email |
| Security H8 | Security | `redirect(session.url!)` without origin assert on `*.stripe.com` |
| Security H9 | Security | No audit trail; pentest evidence stored plaintext; no `updated_at` on findings |
| Framework H1 | Framework | `getSubscription` takes caller-supplied `userId` — exposes any user's subscription status |
| Framework H2 | Packaging | Runtime packages in `devDependencies` (`@base-ui/react`, `clsx`, `sonner`, etc.) |
| Framework H4 | Framework | No Zod input validation on any Server Action |
| Framework H5 | Framework | Actions throw raw `Error`; `useFormState` deprecated in React 19 |
| Code H1 | Code Quality | `assertReportOwner` return value ignored; `getCurrentUserId` duplicated |
| Code H3 | Code Quality | `getSubscription` duplicated 6× and exported from `'use server'` file |
| Code H6 | Code Quality | Race condition in free-tier report limit check (TOCTOU) |
| Arch H1 | Architecture | No input validation; raw Postgres errors surface to browser |
| Perf H2 | Performance | `getSubscription` uncached, fetched on every page navigation |
| Perf H3 | Performance | `createReport` fetches all report UUIDs just to count them |
| Perf H4 | Performance | Missing indexes on `findings.report_id` and `finding_templates.user_id` |
| Test H1 | Testing | No CI pipeline (now P0-13) |
| Test H3 | Testing | Zero server action, zero API route, zero component tests (entire test suite is 2 files) |
| Test H4 | Testing | No integration tests for auth flow |
| Test H5 | Testing | No test for the free-tier report limit TOCTOU race |
| Docs H1 | Docs | README missing deployment guide, env var descriptions, architecture overview |
| Docs H2 | Docs | `SENTRY_AUTH_TOKEN` and `NEXT_PUBLIC_SENTRY_DSN` absent from `.env.local.example` |
| Docs H3 | Docs | No `/.well-known/security.txt` (RFC 9116) |
| Docs H5 | Docs | Drizzle vs Supabase migration split undocumented |
| CI H3 | CI/CD | Preview deployments use production Supabase and live Stripe keys |
| CI H4/H5 | CI/CD | No secret scanning; no automated `pnpm audit` |

---

### P2 — Plan for Next Sprint (Medium Priority)

| Area | Count | Representative examples |
|---|---|---|
| Code Quality | 10 | Massive inline `style={{...}}` usage; `applyTemplate` silently overwrites draft; template value encoded as brittle `"c:0"` string |
| Architecture | 9 | `'unsafe-inline'` in CSP; `redirect()` used for error communication; free-tier check is TOCTOU |
| Security | 8 | `formData.get('x') as string` masks null; auth errors discarded silently; Sentry may capture evidence in stack traces |
| Performance | 8 | No `force-dynamic` on app pages; `getMyTemplates` fetches `select('*')` for a dropdown; Sentry Replay adds MutationObserver CPU overhead |
| Testing | 8 | Vitest has no `jsdom` env; no coverage reporting; no test for `getSubscription` Pro gate; no load test for PDF |
| Documentation | 7 | No self-service data export (GDPR portability); no ADR for admin client pattern; no operational runbook |
| Framework | 7 | `unstable_cache` → `'use cache'`; `server-only` not installed; `camel<T>()` unsound; Toaster never rendered |
| CI/CD | 7 | Session Replay pre-consent; lint script lints nothing; no Sentry alert rules; no rate limiting |

---

### P3 — Backlog (Low Priority)

| Area | Count | Representative examples |
|---|---|---|
| Code Quality | 8 | `signOut` inline in layout; settings uses raw `<label>`; `SEVERITY_COLOURS` dead code; `getStripe`/`getStripeInstance` duplicate name |
| Architecture | 7 | `src/lib/utils.ts` mixes `cn`, `deriveSeverity`, billing constants; IBM Plex Serif at unused weights; `data-theme="light"` hardcoded |
| Security | 6 | `theme-init.js` runs `beforeInteractive`; missing `Permissions-Policy` features; `SENTRY_AUTH_TOKEN` scope undocumented |
| Performance | 5 | `getReports()` orders ascending (worst for pagination); `camel()` recompiles regex on every call; 9 font files loaded |
| Testing | 4 | `vitest.config.ts` doesn't exclude `node_modules` from coverage; no `@vitest/ui`; no `beforeEach` cleanup |
| Documentation | 4 | README emoji headers; no `sitemap.ts`/`robots.ts`; LICENSE doesn't acknowledge OSS dependencies |
| Framework | 5 | `serverExternalPackages` missing for `@react-pdf/renderer`; ES2017 TypeScript target too conservative; redundant `force-dynamic` |
| CI/CD | 4 | README instructs `db:push` for production; wizard error logs committed; no go-live runbook |

---

## Findings by Category

| Category | Critical | High | Medium | Low | Total |
|---|---|---|---|---|---|
| Code Quality | 4 | 8 | 10 | 8 | **30** |
| Architecture | 4 | 7 | 9 | 7 | **27** |
| Security | 6 | 9 | 8 | 6 | **29** |
| Performance | 4 | 6 | 8 | 5 | **23** |
| Testing | 5 | 5 | 8 | 4 | **22** |
| Documentation | 5 | 5 | 7 | 4 | **21** |
| Framework/Language | 3 | 6 | 7 | 5 | **21** |
| CI/CD & DevOps | 3 | 5 | 7 | 4 | **19** |
| **TOTAL** | **34** | **51** | **64** | **43** | **192** |

---

## Recommended Action Plan — June 5 Go-Live

### Day 1 (May 28–29): Structural blockers — no code deploys until these are done

| Task | P0 # | Est. |
|---|---|---|
| Create `src/middleware.ts` (re-export proxy) | P0-1 | 30 min |
| Fix `experimental.serverActions` → top-level `serverActions` key | P0-2 | 15 min |
| Create `vercel.json` with `maxDuration` for export + webhook routes | P0-15 | 30 min |
| Create `.github/workflows/ci.yml` (gitleaks + audit + tsc + test + deploy) | P0-13 | 2 hrs |
| Fix `DATABASE_URL` to pooler URL; add `DATABASE_URL_DIRECT` | P0-14 | 1 hr |
| Add DB migration job to CI pipeline | P0-16 | 1 hr |

---

### Day 2 (May 29–30): Legal/content fixes — required before any public traffic

| Task | P0 # | Est. |
|---|---|---|
| Remove "AI-assisted recommendations" from landing page and Pro tier | P0-8 | 30 min |
| Fix PDF export: landing page says Free, code says Pro | P0-9 | 30 min |
| Add Sentry to privacy policy sub-processor list; update privacy §8 RLS claim | P0-5, P0-6 | 1 hr |
| Enforce 10-finding free-tier limit in `createFinding` | P0-7 | 1 hr |
| Create `/auth/callback` route; add to Supabase redirect allowlist | P0-4 | 1 hr |

---

### Day 3–4 (May 30–Jun 1): Core security fixes

| Task | P0 # | Est. |
|---|---|---|
| Enable RLS on all 4 tables; migrate CRUD to SSR client | P0-3 | 4–6 hrs |
| Add Stripe event dedup table; handle `invoice.payment_failed` | P0-10 | 3 hrs |
| Fix `deleteAccount`: fail-closed on Stripe cancel; wrap in SECURITY DEFINER fn | P0-11 | 2 hrs |
| Add PDF render timeout + finding cap in export route | P0-12 | 1 hr |

---

### Day 5 (Jun 1–2): Verification and smoke testing

| Task | Est. |
|---|---|
| Run full test suite; confirm CI pipeline is green | 2 hrs |
| Test email signup → confirmation → callback → dashboard full flow | 1 hr |
| Test PDF export with 50+ findings; confirm no timeout | 30 min |
| Test `deleteAccount` with Stripe in test mode | 30 min |
| Verify `pnpm audit` returns no high-severity findings | 30 min |
| Confirm Sentry is capturing errors in staging deployment | 30 min |

---

### Day 6–7 (Jun 2–4): P1 hardening (parallel with testing)

Priority order within P1:
1. Add Zod validation to all Server Actions (prevents DoS + DB errors surfacing)
2. Move runtime packages from `devDependencies` to `dependencies`
3. Add `server-only` guard to `src/lib/supabase/admin.ts` and `src/lib/stripe.ts`
4. Fix `getSubscription` to derive `userId` internally
5. Add indexes on `findings.report_id` and `finding_templates.user_id`
6. Rate limiting: Vercel Firewall rules for PDF export; Supabase built-in for auth
7. Add `/.well-known/security.txt`
8. Update `.env.local.example` with all required variables (Sentry, both DB URLs)

---

### Day 8 (Jun 4): Go-live checklist

- [ ] All P0 issues resolved and verified
- [ ] CI pipeline green on `main`
- [ ] Vercel preview deployment tested against staging Supabase + Stripe test keys
- [ ] Sentry alert rules configured (new issue → email; error spike → email)
- [ ] Vercel project confirmed on Pro plan (required for `maxDuration: 60`)
- [ ] Supabase PITR (point-in-time recovery) confirmed enabled
- [ ] Stripe webhook registered at production URL with correct events subscribed
- [ ] `NEXT_PUBLIC_APP_URL` matches production URL in Vercel env vars
- [ ] Privacy policy reviewed and accurate at time of launch
- [ ] Rollback procedure documented (Vercel Deployments tab → Promote to Production)

---

## Quick Reference — Critical File Hit List

| File | Issues |
|---|---|
| `src/middleware.ts` | **CREATE** — currently missing; proxy.ts never executes |
| `src/app/auth/callback/route.ts` | **CREATE** — email confirmation flow is broken without it |
| `.github/workflows/ci.yml` | **CREATE** — no CI pipeline exists |
| `vercel.json` | **CREATE** — PDF export will timeout without `maxDuration` |
| `src/app/actions/findings.ts` | Add finding count cap; add Zod validation; fix `ActionResult<T>` pattern |
| `src/app/actions/reports.ts` | Fix `getSubscription` to not accept caller-supplied userId |
| `src/app/actions/settings.ts` | Fix `deleteAccount` atomicity; fail-closed on Stripe cancel |
| `src/app/api/stripe/webhook/route.ts` | Add event dedup; add `invoice.payment_failed` handler |
| `src/app/(app)/reports/[id]/export/route.tsx` | Add timeout + finding cap; pin `runtime = 'nodejs'` |
| `next.config.ts` | Fix `experimental.serverActions` → top-level; add `serverExternalPackages` |
| `src/app/privacy/page.tsx` | Add Sentry sub-processor; fix RLS claim |
| `src/app/page.tsx` | Remove AI feature; fix PDF export free/Pro claim |
| `src/app/terms/page.tsx` | Fix 10-finding claim or implement it |
| `.env.local.example` | Add `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_SENTRY_DSN`, `DATABASE_URL_DIRECT` |
| `src/lib/db/index.ts` | Switch to Supavisor pooler URL |
| `src/lib/supabase/admin.ts` | Add `import 'server-only'`; add env var assertion |

---

*Review files: [00-scope.md](00-scope.md) | [01-quality-architecture.md](01-quality-architecture.md) | [02-security-performance.md](02-security-performance.md) | [03-testing-documentation.md](03-testing-documentation.md) | [04-best-practices.md](04-best-practices.md)*
