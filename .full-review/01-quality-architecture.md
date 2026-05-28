# Phase 1: Code Quality & Architecture Review

---

## Code Quality Findings

### CRITICAL

**C1 — Server actions throw raw `Error` strings — no user-facing error UX**
Files: `src/app/actions/findings.ts`, `src/app/actions/reports.ts`, `src/app/actions/templates.ts`
Every server action throws `Error` on failure, which trips the global React error boundary. The free-tier limit in `createReport` shows a full-page crash instead of an inline message. Fix: adopt a uniform `ActionResult<T>` type and use `useActionState` / redirect pattern.

**C2 — `deleteAccount` is non-transactional — partial deletion leaves active Stripe sub + orphan data**
File: `src/app/actions/settings.ts` (lines 49–96)
Stripe cancel errors are swallowed; DB deletions run in a non-atomic `Promise.all`. A billing/GDPR risk. Fix: run data deletion via a Postgres SECURITY DEFINER function; fail-closed on Stripe cancel before deleting anything.

**C3 — Webhook has no idempotency; `invoice.payment_failed` not handled**
File: `src/app/api/stripe/webhook/route.ts`
Stripe retries produce duplicate writes. Out-of-order events (late `checkout.session.completed`) can overwrite newer subscription status. A user whose payment fails keeps Pro indefinitely until the next `subscription.updated`. Fix: deduplicate by event ID via a `stripe_events_processed` table; add `invoice.payment_failed` and `customer.subscription.paused` handlers.

**C4 — `src/data/mock.ts` is dead code with competing types**
File: `src/data/mock.ts`
345-line file defines `Report`, `Finding`, `Template` with entirely different field names from the live Drizzle schema. Not imported anywhere. A confusion/bug magnet for any new contributor. Fix: delete before launch.

---

### HIGH

**H1 — `assertReportOwner` return value ignored; `getCurrentUserId` duplicated**
File: `src/app/actions/findings.ts`
Redundant round trips on every finding mutation; inconsistent helper pattern. Consolidate into `requireUser()` / `requireReportOwnership()` in `src/lib/auth/guards.ts`.

**H2 — FormData parsing duplicated 14× with no validation or size caps**
Files: `src/app/actions/findings.ts`, `src/app/actions/reports.ts`
No Zod/Valibot validation. `cvssScore` accepts any string; `description`/`evidence` accept unlimited length (PDF render will OOM on large inputs). Fix: shared `FindingInput` Zod schema.

**H3 — `getSubscription` duplicated 6× and exported from a server-action file**
Files: `src/app/actions/reports.ts`, `src/app/(app)/reports/[id]/export/route.tsx`, settings, templates
`isPro` check re-implemented at every call site. `getSubscription` exported from a `'use server'` file crosses the network boundary when called from server components. Fix: extract to `src/lib/billing/access.ts` with a `getUserPlan()` helper.

**H4 — `camel<T>()` is an unsound type cast + regex-based date coercion**
File: `src/lib/supabase/admin.ts`
The `as T` cast is unsound (Drizzle `cvssScore: string | null` vs Supabase `number | null`). Auto-Date regex matches user-supplied strings. Fix: explicit per-table row mappers, or switch entirely to Drizzle.

**H5 — `signInWithPassword` used for current-password verification rotates the session**
File: `src/app/actions/settings.ts` (lines 35–39)
Rotates access/refresh tokens as a side effect; may cause session mismatches on other tabs. `user.email!` throws if OAuth-only user. Fix: guard email presence; add a clear comment on the intentional side-effect.

**H6 — Race condition in free-tier limit check (TOCTOU)**
File: `src/app/actions/reports.ts` (lines 28–67)
Two concurrent submits at count 2 both pass the check. Fix: move enforcement to a Postgres trigger or advisory lock.

**H7 — Severity/status literal types scattered as inline string-unions 6+ times**
Files: dashboard, reports/[id], templates, finding-card
`'critical' | 'high' | 'medium' | 'low' | 'info'` and `'draft' | 'active' | 'final'` duplicated everywhere. `SEV_ORDER` redefined locally. Fix: centralize to `src/lib/types/domain.ts`.

**H8 — `report-card.tsx` is dead code referencing non-existent UI primitives**
File: `src/components/reports/report-card.tsx`
Imports `@/components/ui/card` and `@/components/ui/button` (not in the design system); uses Tailwind classes while the rest uses CSS variables. Dashboard renders inline JSX instead. Fix: delete.

---

### MEDIUM

**M1** — Massive inline `style={{...}}` usage across all page components (render cost + CSP risk)
**M2** — `applyTemplate` silently overwrites user draft with no confirmation
**M3** — Template select value is encoded as a brittle `"c:0"` string; OOB access crashes silently
**M4** — `Promise.all` of unrelated queries on report page — single failure 500s the whole view
**M5** — `getMyTemplates()` called for free-tier users — wasted query
**M6** — `saveTemplate` returns silently on ownership failure — no error surfaced to user
**M7** — `getPeriodEnd` assumes first subscription item; `items.data[0]` can be undefined
**M8** — PDF route has no finding count cap or render timeout
**M9** — Settings usage bar shows hardcoded "1 / 3" mock data in production ← credibility issue
**M10** — Dashboard search/filter/export buttons are non-functional UI placeholders

---

### LOW

L1 — `signOut` inline server action in layout; move to `src/app/actions/auth.ts`
L2 — Settings page uses raw `<label>` instead of the `<Field>` component used elsewhere
L3 — `SEVERITY_COLOURS` constants reference Tailwind classes; app uses CSS variables; dead code
L4 — `getStripe()` / `getStripeInstance()` are two names for the same function
L5 — App routes missing `robots: { index: false }` metadata
L6 — `notFound()` before ownership check is correct; document via `requireReportOwnership()` helper
L7 — `createCheckoutSession` doesn't guard against already-Pro users double-subscribing
L8 — `db` Drizzle export in `src/lib/db/index.ts` is never used at runtime

---

## Architecture Findings

### CRITICAL

**C1 — Service-role key is the only data access path; RLS is effectively disabled**
Files: `src/lib/supabase/admin.ts`, all four `src/app/actions/*.ts`, export route
Every user-scoped operation uses the service-role key, which bypasses Row Level Security. Auth is enforced by hand-written `.eq('user_id', …)` TypeScript clauses only — one missed clause = full tenant data breach. Drizzle is configured but never used at runtime. Fix: use the SSR Supabase client (`createClient()`) for user-scoped reads; keep `adminDb()` for webhook and account deletion only. Write and enable RLS policies for all four tables.

**C2 — No foreign keys, no cascade delete; Drizzle schema and live DB are out of sync**
Files: `src/lib/db/schema.ts`, `src/lib/db/database.types.ts`, `src/app/actions/settings.ts`
`findings.reportId`, `subscriptions.userId`, etc. are plain `uuid` columns with no `.references()`. No FK constraints means no DB-level integrity guarantee. The sole migration file (`20260525000000_add_affected_component.sql`) indicates the original tables were created outside Drizzle. Fix: add `.references()` with `onDelete: 'cascade'` to Drizzle schema; apply migration; simplify `deleteAccount` to a single `auth.admin.deleteUser()` call once cascade is in place.

**C3 — Sentry Session Replay fires on anonymous visitors with no consent gate**
File: `src/instrumentation-client.ts`
`replaysSessionSampleRate: 0.05` + `replaysOnErrorSampleRate: 1.0` records landing-page visitors before any consent. ICO/GDPR requires lawful basis for session replay. The privacy page exists but doesn't enumerate Sentry as a sub-processor. Fix: gate `replayIntegration` behind consent signal; update privacy notice.

**C4 — Auth protection is split between proxy (hand-maintained path list) and layout; route handlers bypass both**
Files: `src/proxy.ts`, `src/app/(app)/layout.tsx`, `src/app/(app)/reports/[id]/export/route.tsx`
Adding a new `(app)/` route without updating the proxy list leaves it unprotected until the layout fires. Route handlers and server actions bypass the layout entirely. Fix: invert to an allowlist of *public* paths in the proxy (fail-closed); document that route handlers must always call `auth.getUser()`.

---

### HIGH

**H1 — No input validation in any server action; FormData cast directly to DB types**
All four `src/app/actions/*.ts` — no Zod, no length caps, no type enforcement. Raw Postgres errors can surface to the browser, leaking schema details. Fix: shared Zod schemas per resource.

**H2 — `camel<T>()` is structurally unsound and auto-converts user data to Date objects**
File: `src/lib/supabase/admin.ts` — `as T` cast mismatches actual Supabase column types; regex date detection runs on all string values including user content. Fix: explicit row mappers, or use Drizzle.

**H3 — Stripe webhook not idempotent; stale snapshot risk; missing event types**
File: `src/app/api/stripe/webhook/route.ts` — no event-ID deduplication, `invoice.payment_failed` unhandled, inline `subscriptions.retrieve` can cause Stripe to retry on slow response. Fix: `stripe_events` dedup table; handle payment failure; background the retrieve.

**H4 — Per-operation auth round trips (3 Supabase calls per finding mutation)**
File: `src/app/actions/findings.ts` — byproduct of bypassing RLS; with RLS enabled this collapses to zero extra calls. Fix tied to C1.

**H5 — `getSubscription` imported across domain boundaries (templates → reports → billing)**
Files: `src/app/actions/reports.ts`, `src/app/actions/templates.ts` — billing is a cross-cutting concern wrongly anchored in the reports module. Fix: `src/lib/entitlements.ts`.

**H6 — Two competing domain models: Drizzle schema vs `src/data/mock.ts`**
Fields `cvss`/`cvssScore`, `category`, `owasp`, `cve` exist in mock but not DB. Type name collision. Fix: delete or namespace as `PreviewFinding`.

**H7 — Two parallel template stores: static TypeScript array + `finding_templates` DB table**
Files: `src/lib/templates.ts`, `src/app/actions/templates.ts` — separate code paths, no unified interface. Fix: seed curated templates as system rows, or unify via a common `Template` interface.

---

### MEDIUM

**M1** — `'unsafe-inline'` in `script-src` CSP; Next.js supports nonce-based CSP as the proper fix
**M2** — Raw `Error` thrown in actions; Postgres error details surface to browser
**M3** — `redirect()` used for structured error communication; prevents `useFormState` pattern
**M4** — Free-tier check is a racy TOCTOU; enforce at DB layer
**M5** — `updatePassword` `signInWithPassword` side-effects session rotation
**M6** — `serverActions.allowedOrigins` with `??''` breaks on Vercel preview deployments
**M7** — No subscription event history; breaks billing disputes and GDPR subject-access requests
**M8** — No `updatedAt` on `findings` or `reports` tables
**M9** — Email confirmation callback route (`/auth/callback`) not visible in reviewed scope; may be missing

---

### LOW

L1 — `src/lib/utils.ts` mixes `cn`, `deriveSeverity`, design tokens, billing constants — split into 3 files
L2 — IBM Plex Serif loaded at unused weights; 9 font files behind auth
L3 — `data-theme="light"` hardcoded in `<html>` conflicts with `theme-init.js` (flash risk)
L4 — Sentry `tracesSampleRate: 0.2` applies to Stripe webhook; use `tracesSampler` per route
L5 — `"pnpm": "^11.3.0"` in devDependencies is unusual; typically managed by corepack
L6 — `getReports()` and `getFindings()` use `select('*')` with no pagination or `.limit()`
L7 — No `robots.ts` / `sitemap.ts` for landing-page SEO

---

## Critical Issues for Phase 2 Context

The following findings from Phase 1 directly inform security and performance analysis:

1. **RLS bypassed via service-role key** (Arch C1) — the security review must assess the actual exploit surface of every `adminDb()` call without a user filter.
2. **No input validation / no size caps** (QA H2, Arch H1) — unvalidated `evidence`/`description` fields flow into PDF render and potentially future HTML surfaces; performance review must account for unbounded payloads.
3. **Stripe webhook non-idempotent with swallowed errors** (QA C3, Arch H3) — both a security concern (subscription resurrection via replay) and reliability concern.
4. **`deleteAccount` non-atomic with swallowed Stripe cancel error** (QA C2) — billing/GDPR compliance risk.
5. **Sentry replay firing pre-consent** (Arch C3) — compliance risk overlaps with security audit scope.
6. **No pagination on `getReports`/`getFindings`** (Arch L6) — performance concern at scale.
7. **PDF `renderToBuffer` has no timeout or size cap** (QA M8) — DoS/OOM risk.
