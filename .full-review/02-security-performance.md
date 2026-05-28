# Phase 2: Security & Performance Review

---

## Security Findings

### CRITICAL

**C1 — Service-role key bypasses RLS across the entire data plane**
CVSS 9.1 | CWE-285, CWE-639
Files: `src/lib/supabase/admin.ts`, all four `src/app/actions/*.ts`, export route, reports/[id]/page.tsx

Every single database read/write runs as the DB superuser via `adminDb()`. Supabase RLS is completely inactive. Authorization is enforced only by hand-coded `.eq('user_id', user.id)` TypeScript — one missed clause = full multi-tenant breach. The landing page at `src/app/page.tsx:110` claims "secure by default / row-level security" — this is materially false today.

Fix: enable RLS on all four tables with policies; use the SSR user-scoped client for all per-user CRUD; keep `adminDb()` only for the Stripe webhook and `auth.admin.deleteUser`.

```sql
alter table reports enable row level security;
alter table findings enable row level security;
alter table subscriptions enable row level security;
alter table finding_templates enable row level security;

create policy "reports_owner" on reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "findings_via_report" on findings
  for all using (exists (select 1 from reports r where r.id = findings.report_id and r.user_id = auth.uid()));
create policy "subs_owner_read" on subscriptions
  for select using (auth.uid() = user_id);
create policy "tpl_owner" on finding_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

---

**C2 — No input validation — FormData cast directly to DB; no length caps, no sanitisation**
CVSS 8.6 | CWE-20, CWE-770, CWE-79
Files: all four `src/app/actions/*.ts`

Zero schema validation. `description`, `evidence`, `impact` accept unlimited text. `cvssScore: parseFloat(... as string) || 0` silently stores negative values, values >10, and NaN→0. No length caps means: (1) storage exhaustion DoS, (2) OOM in PDF render, (3) future CSV/HTML export injection. `evidence` in `finding-card.tsx` is React-escaped so no current XSS, but the PDF render and any future HTML surface are affected.

Fix: shared Zod validators per resource:
```ts
export const FindingInput = z.object({
  title: z.string().trim().min(1).max(200),
  cvssScore: z.coerce.number().min(0).max(10),
  description: z.string().trim().max(20_000).optional().nullable(),
  evidence: z.string().max(50_000).optional().nullable(),
  // ... etc
})
```
Plus Postgres CHECK constraints as belt-and-braces.

---

**C3 — Stripe webhook non-idempotent — replaying events can resurrect cancelled subscriptions**
CVSS 8.2 | CWE-352, CWE-841, CWE-672
File: `src/app/api/stripe/webhook/route.ts`

No event-ID deduplication. Out-of-order delivery (`customer.subscription.deleted` before a late `customer.subscription.updated`) overwrites cancellation with active status. `invoice.payment_failed` is unhandled — users keep Pro indefinitely on failed payment. Stripe retries on transient DB failure replay upserts without idempotency.

Fix: add a `stripe_events` dedup table:
```sql
create table stripe_events (id text primary key, type text not null, received_at timestamptz not null default now());
```
Check before processing, insert atomically with the subscription upsert in a single transaction. Handle `invoice.payment_failed`, `customer.subscription.paused`.

---

**C4 — `deleteAccount` non-atomic; Stripe cancel errors swallowed; active billing survives deletion**
CVSS 8.1 | CWE-755, CWE-672, CWE-209
File: `src/app/actions/settings.ts` (lines 49–96)

Stripe cancel exception is caught and logged — if Stripe is down, user data is wiped while billing continues. DB deletions run across 5 non-transactional calls. Double-submit race. Cookies cleared before `deleteUser` — if `deleteUser` throws, user is signed out but account persists. No grace period, no data export before deletion (GDPR Art.20).

Fix: fail-closed on Stripe cancel; wrap DB deletions in a Postgres SECURITY DEFINER function (atomic); guard against double-submit with a server-side `deleting` flag.

---

**C5 — PDF render is unbounded — DoS via `@react-pdf/renderer`**
CVSS 7.5 | CWE-400, CWE-770
File: `src/app/(app)/reports/[id]/export/route.tsx` (lines 39–47)

No timeout, no max-finding count, no max total text length, no concurrency limit. Combined with C2 (no input length caps), an authenticated Pro user can allocate 200–600 MB per render call and crash the Vercel function. Multiple concurrent calls from the same user exhaust the Lambda.

Fix:
```ts
const MAX_FINDINGS = 200
const MAX_TOTAL_CHARS = 1_500_000
// check before render + Promise.race with 30s timeout
```

---

**C6 — Free-tier finding cap advertised but never enforced**
CWE-840, CWE-1284
Files: `src/app/page.tsx:165`, `src/app/terms/page.tsx:59` (advertised); `src/app/actions/findings.ts` (not enforced)

Terms of Service and marketing page state "10 findings per report" for free tier. `createFinding` enforces no such limit. Combined with C2 and C5, a free user can store 5,000 findings with multi-KB evidence blobs and trigger massive PDF renders. This is also a contract violation (Terms state a limit that the product doesn't enforce).

Fix: check `count(*)` of findings per report before insert; enforce `FREE_FINDING_LIMIT = 10`.

---

### HIGH

**H1 — Sentry Session Replay fires on anonymous visitors pre-consent — GDPR/UK PECR violation**
CVSS 5.3 + legal | CWE-359
File: `src/instrumentation-client.ts:17-27`
5% of every page load starts a session replay before any consent UI exists. ePrivacy Directive Art.5(3) and UK PECR Reg.6 require prior consent for non-strictly-necessary processing. Privacy page doesn't disclose Sentry as sub-processor. Fix: gate `replayIntegration` behind consent; disable on landing/auth pages; update privacy page.

**H2 — No rate limiting on any endpoint**
CVSS 7.5 | CWE-307, CWE-770
Files: all server actions, auth form, export route
Login brute force, password change brute force, PDF render spam, signup email bombing. No captcha, no lockout, no throttle. Fix: Upstash Rate Limit — 10/min/IP on login, 5/min/IP on signup, 10/hour/user on PDF export.

**H3 — Service-role key available to all server modules; no key minimisation**
CVSS 6.5 | CWE-522, CWE-798
Files: `src/lib/supabase/admin.ts`, `src/lib/stripe.ts`
One SSRF/RCE in any dependency = full DB takeover. Same Stripe secret key used for webhook, checkout, portal, cancel — violates least privilege. No secret scanning in CI. Fix: use Stripe restricted keys; add `gitleaks` to CI; consider vault-backed secret fetch.

**H4 — CSP `'unsafe-inline'` on `script-src` — XSS hardening incomplete**
CVSS 6.1 | CWE-79
File: `next.config.ts:15`
`'unsafe-inline'` negates most CSP XSS-mitigation value. Next.js 16 supports nonce-based CSP. No `Report-To` directive — zero visibility on violations. Fix: nonce-based CSP via `proxy.ts`; add `report-uri` pointing to Sentry.

**H5 — Stripe success/cancel URLs built from env var without origin validation**
CVSS 6.1 | CWE-601
File: `src/lib/stripe.ts:24-25`
Misconfigured `NEXT_PUBLIC_APP_URL` → open redirect mid-checkout. Fix: assert HTTPS origin format at startup; validate before `redirect()`.

**H6 — Auth runs entirely client-side; no MFA, no email confirmation gating, no audit log**
CVSS 6.5 | CWE-287, CWE-308
File: `src/components/auth/auth-form.tsx`
`signInWithPassword` called browser-side — no server-side login audit trail, no IP capture, no TOTP MFA, no HIBP check, no CAPTCHA. Email confirmation may not be enforced (gating not verified). For a SaaS storing pentest data, MFA is a customer expectation. Fix: enable Supabase TOTP MFA; move auth to server actions for audit logging; add hCaptcha/Turnstile.

**H7 — Stripe webhook userId-from-metadata not cross-checked against customer email**
CVSS 5.3 | CWE-345
File: `src/app/api/stripe/webhook/route.ts:33-41`
A user who pays with one email can have a different application account email — refund/dispute trail won't match. Fix: cross-check `checkoutSession.customer_email` against `authUser.user.email` and log mismatches.

**H8 — Stripe `redirect(session.url!)` without origin allow-list check**
CVSS 5.4 | CWE-601
File: `src/app/(app)/settings/page.tsx:14,25`
No assertion that session.url is on `*.stripe.com`. Fix: `assertStripeHostname()` before every `redirect()` to a Stripe URL.

**H9 — No audit trail; no at-rest encryption for pentest evidence data**
CVSS 5.5 / regulatory | CWE-311, CWE-778
Files: `src/lib/db/schema.ts`, all server actions
Pentest findings (IP ranges, credentials, exploitation steps) stored plaintext. No `updated_at`, no soft-delete, no audit log. Service-role compromise = immediate plaintext exfiltration. Customers will require this before signing. Fix: add audit_log table; roadmap field-level encryption for `evidence`/`description`.

---

### MEDIUM

**M1** — `formData.get('x') as string` masks `null` — CVSS score silently defaults to 0 on missing fields
**M2** — `auth.getUser()` errors discarded — auth service failures silently log users out with no telemetry
**M3** — Sentry server captures may include `evidence`/`description` content in stack traces (CWE-532)
**M4** — Dormant Drizzle client (`src/lib/db/index.ts`) still loads `DATABASE_URL` and opens a connection
**M5** — `getCurrentUserId()` doesn't check `email_confirmed_at` — unverified accounts can create data
**M6** — CSP `connect-src *.supabase.co` allows exfiltration to any Supabase tenant under XSS
**M7** — Webhook should check `event.livemode` matches `NODE_ENV === 'production'` to reject test events in prod
**M8** — Supabase default SMTP for auth emails; no custom SPF/DKIM/DMARC; phishing trivial to craft

---

### LOW

L1 — `theme-init.js` runs `beforeInteractive` — verify it's not user-influenced and is SRI-pinned
L2 — `/login` and `/signup` lack explicit `Cache-Control: no-store` despite `force-dynamic`
L3 — Permissions-Policy missing modern features (`interest-cohort`, `browsing-topics`, `payment`)
L4 — `serverActions.allowedOrigins` fallback to `''` (filtered) — add startup assertion for `NEXT_PUBLIC_APP_URL`
L5 — `SENTRY_AUTH_TOKEN` scope and rotation schedule not documented
L6 — Account deletion confirmation normalises whitespace (`trim()`) — use exact string match

---

## Performance Findings

### CRITICAL

**C1 — Unbounded `renderToBuffer` — OOM / Vercel function timeout**
File: `src/app/(app)/reports/[id]/export/route.tsx:39-47`
No timeout, no finding cap, no field truncation. 200 findings × 50 KB evidence = potential 600 MB allocation in a single Lambda call. `@react-pdf/renderer` v4 renders synchronously — no streaming, no progressive render. Vercel default timeout is 10s (hobby) / 60s (Pro). Fix: `MAX_FINDINGS = 200`, `RENDER_TIMEOUT_MS = 30_000`, `Promise.race` with timeout.

**C2 — No pagination on `getReports()` / `getFindings()` + no DB indexes**
Files: `src/app/actions/reports.ts:19-25`, `src/app/actions/findings.ts:26-33`
`select('*')` with no `.limit()`. 500 reports × 5 KB = 2.5 MB per dashboard load. `order('created_at')` without an index = sequential scan. No indexes declared in `schema.ts`. Fix: add composite indexes; add `.range()` pagination; select only needed columns.

**C3 — N+1 auth round trips on every finding mutation (3 Supabase calls per operation)**
File: `src/app/actions/findings.ts:9-22`
`auth.getUser()` + `select id from reports where id=? and user_id=?` + mutation = 3 round trips per finding CRUD. Collapses to 1 with RLS enabled (security fix C1 resolves this too).

**C4 — Stripe `subscriptions.retrieve` blocks webhook response — retry storm risk**
File: `src/app/api/stripe/webhook/route.ts:43-53`
Synchronous Stripe API call before 200 ack. If Stripe API degrades (>30s), webhook times out and Stripe retries, re-entering the same blocking path. Fix: trust the session data directly; use `customer.subscription.updated` as authoritative for `period_end`; return 200 immediately.

---

### HIGH

**H1 — `Promise.all` on report page mixes critical and non-critical queries; triple auth validation**
File: `src/app/(app)/reports/[id]/page.tsx:31-35`
`getMyTemplates()` failure aborts the entire report page. It also calls `auth.getUser()` independently — the page makes 3 separate JWT validation round-trips. Fix: `Promise.allSettled` + fall back to `[]` for templates; pass pre-validated `userId` down to avoid re-auth.

**H2 — `getSubscription` uncached, refetched on every page navigation**
Files: settings, templates, reports/[id], export route
Subscription status changes at most once per billing cycle yet is fetched on every render. Fix: `unstable_cache` with tag-based invalidation; `revalidateTag()` in the webhook after upsert.

**H3 — `createReport` fetches all report UUIDs to count them instead of using `count: 'exact'`**
File: `src/app/actions/reports.ts:31-36`
Transfers all UUIDs over the network just for `.length >= 3`. Fix: `.select('id', { count: 'exact', head: true })`.

**H4 — Missing indexes on `findings.report_id` and `finding_templates.user_id`**
File: `src/lib/db/schema.ts`
`getFindings(reportId)` and `getMyTemplates()` both do full table scans. Fix: add composite indexes in schema.

**H5 — No Supavisor connection pooling; every cold start creates a fresh PostgREST connection**
File: `src/lib/supabase/admin.ts`
The `_client` singleton only helps within one warm Lambda. No connection reuse across concurrent invocations. Fix: configure Supabase pooler URL for `adminDb()`.

**H6 — `getFindings()` re-runs ownership check that the report page already performed**
File: `src/app/actions/findings.ts:24-33`
Redundant DB round trip on every report page load. Fix: accept pre-validated `userId` parameter from the page that already verified ownership.

---

### MEDIUM

**M1** — No `export const dynamic = 'force-dynamic'` on app pages — risk of accidental static CDN caching
**M2** — `getMyTemplates` fetches `select('*')` for a dropdown that only needs `id, title, cvss_score, severity`
**M3** — Dashboard search/filter is inert HTML — full dataset loaded regardless of any future filter state
**M4** — PDF export has no per-user rate limiting or concurrency cap; 3 concurrent renders can exhaust Lambda RAM
**M5** — `camel()` recompiles `/_([a-z])/g` regex on every call; allocates new object per row — hoist to module scope
**M6** — Findings sorted 3× independently (fetch → UI → PDF) — source of potential order divergence
**M7** — Sentry Replay `MutationObserver` on large findings list causes CPU overhead on every keystroke
**M8** — 9 font files loaded (3 IBM Plex families) including potentially unused IBM Plex Serif

---

### LOW

L1 — `FindingForm` re-renders all templates on every keystroke; use `React.memo` on template selector
L2 — `getReports()` orders ascending (oldest first); change to descending for better UX + earlier pagination cutoff
L3 — `deleteAccount` manually fetches all report IDs before deleting findings; FK cascade removes this entirely
L4 — `next.config.ts` missing `serverExternalPackages: ['@react-pdf/renderer']` — risk of webpack bundling Node-only modules
L5 — Webhook returns 500 on processing errors → Stripe retries indefinitely; return 200 for non-transient errors and Sentry-capture instead

---

## Critical Issues for Phase 3 Context

The following inform testing and documentation requirements:

1. **RLS is disabled** — there are zero tests covering cross-tenant isolation (there can't be — the feature doesn't exist yet). Tests must be added for: user A cannot read user B's reports/findings/templates.
2. **No input validation** — no tests for length-limit enforcement, CVSS bounds, malformed dates. These need both unit tests (Zod schema) and integration tests (server action rejects oversized input).
3. **Free-tier finding cap advertised but unenforced** — needs a test confirming the 11th finding is rejected.
4. **Webhook idempotency** — needs tests for: duplicate event delivery, out-of-order events, missing userId in metadata.
5. **PDF render bounds** — needs a test confirming the 201st finding triggers a 413 response, not a timeout.
6. **No CI pipeline exists** — `gitleaks`, `pnpm audit`, type-checking, and the test suite are not automated.
7. **Sentry consent gating** — documentation must be updated (privacy page, cookie policy) before any replay runs in production.
