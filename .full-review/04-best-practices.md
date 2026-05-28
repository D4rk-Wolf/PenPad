# Phase 4: Best Practices & Standards

---

## Framework & Language Findings

### CRITICAL

**C1 — `middleware.ts` is missing — `proxy.ts` never executes — all app routes are unprotected**
File: `src/proxy.ts` (exists); `src/middleware.ts` (MISSING)
`src/proxy.ts` implements the Supabase session-refresh middleware and route guards. However, there is no `src/middleware.ts` (or `middleware.ts` in the project root). Next.js only picks up middleware from a file named exactly `middleware.ts` (or `.js`) at the root of the `src/` folder. The proxy code is completely inert — it is never executed. Every protected route (`/dashboard`, `/reports/*`, `/settings`, `/templates`) is currently unguarded at the edge. The `(app)/layout.tsx` auth check fires only when the layout renders — a hard redirect — but middleware-level session cookie refresh and edge route protection are absent.

Fix: Create `src/middleware.ts`:
```ts
export { proxy as middleware, config } from '@/proxy'
```
Then verify that `src/proxy.ts` exports both `proxy` (the handler) and `config` (the matcher).

---

**C2 — `experimental.serverActions.allowedOrigins` is an obsolete config key in Next.js 16 — CSRF protection is silently disabled**
File: `next.config.ts`
Per the bundled Next.js 16 docs (`node_modules/next/dist/docs/.../serverActions.md`): "Server Actions became a stable feature in Next.js 14. The `experimental.serverActions` object was only valid in Next.js 13." In Next.js 16, the correct location is the top-level `serverActions` key. The current config means `allowedOrigins` is silently ignored — cross-origin CSRF protection for Server Actions is not enforced at all.

Fix:
```ts
const nextConfig: NextConfig = {
  serverActions: {
    allowedOrigins: [
      'localhost:3000',
      process.env.NEXT_PUBLIC_APP_URL ?? '',
    ].filter(Boolean),
  },
  // remove experimental.serverActions entirely
}
```

---

**C3 — Module-level singleton admin/Stripe clients create shared mutable state across concurrent requests**
Files: `src/lib/supabase/admin.ts`, `src/lib/stripe.ts`
Both use a module-level `let _client = null` singleton. Under the Next.js App Router Node.js runtime, module-level singletons persist across the entire process lifetime. If `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` is missing at cold-start, the partially-initialized client is cached and silently fails for all subsequent requests. A single Supabase admin connection is shared across all concurrent requests with no connection pooling awareness (compounded by the direct-connection issue found in CI/CD C-3).

Fix: Add `'server-only'` guard and validate env vars at instantiation:
```ts
import 'server-only'
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}
```

---

### HIGH

**H1 — `getSubscription` takes a caller-supplied `userId` parameter — exposes any user's subscription status**
File: `src/app/actions/reports.ts`
`getSubscription(userId: string)` is a `'use server'` export. Any client can invoke it with an arbitrary `userId` string and learn the subscription status of any user. Server Actions that return per-user data must derive `userId` internally from `createClient().auth.getUser()`, never from the caller.

Fix:
```ts
export async function getSubscription(): Promise<Subscription | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // query by user.id internally
}
```

**H2 — Runtime packages incorrectly in `devDependencies`**
File: `package.json`
The following packages are imported in production application code but declared under `devDependencies`: `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `next-themes`, `sonner`. These will be absent in any deployment that installs with `--prod` flag. Move all to `dependencies`.

**H3 — `pnpm` is declared as a `devDependency` — should use `packageManager` field instead**
File: `package.json`
`"pnpm": "^11.3.0"` under `devDependencies` is non-standard and can confuse tooling. Replace with the canonical approach:
```json
"packageManager": "pnpm@11.3.0"
```

**H4 — No input validation (Zod) on any Server Action — raw `FormData` cast to DB types**
Files: all four `src/app/actions/*.ts`
Every Server Action reads from `FormData` with raw casts: `formData.get('title') as string`, `parseFloat(formData.get('cvssScore') as string)`. Zero length enforcement, type coercion safety, or schema validation. Raw Postgres errors can surface to the browser, leaking schema details.

Fix: Add `zod` to `dependencies` and define schemas:
```ts
const FindingSchema = z.object({
  title:     z.string().min(1).max(250),
  cvssScore: z.coerce.number().min(0).max(10),
  description: z.string().max(5000).optional(),
})
```

**H5 — Server Actions throw raw `Error`; `useFormState` is deprecated in React 19**
Files: all four `src/app/actions/*.ts`, client components using them
Actions throw on error, hitting the global error boundary for any DB failure. `useFormState` from `react-dom` is deprecated in React 19. The correct pattern is `useActionState` from `react` plus an `ActionResult<T>` discriminated union.

**H6 — Double auth + ownership check on every report page load (3 Supabase round-trips per navigation)**
File: `src/app/(app)/reports/[id]/page.tsx`
The page validates auth/ownership, then calls `getFindings(id)` which calls `assertReportOwner()` again — creating a new Supabase client, calling `auth.getUser()`, and querying `reports` a second time. Pre-validate and pass `userId` down.

---

### MEDIUM

**M1 — `unstable_cache` is replaced by `'use cache'` directive in Next.js 16**
Per bundled Next.js 16 docs: `unstable_cache` is superseded by the `'use cache'` directive + `cacheTag` / `revalidateTag`. No caching is used at all currently — every page render hits the database cold. `getReports`, `getSubscription`, and `getFindings` are prime candidates.

**M2 — `server-only` package not installed — admin client can be imported in Client Components**
`src/lib/supabase/admin.ts` exports the service-role client without a `server-only` guard. A developer accidentally importing it from a `'use client'` file would bundle the service-role key into the client bundle. `pnpm add server-only` + `import 'server-only'` at the top of the file.

**M3 — `dynamic = 'force-dynamic'` is a no-op in Next.js 16 (all routes are dynamic by default)**
Per bundled migration guide: all routes are dynamic by default in Next.js 16 unless `'use cache'` is adopted. The `force-dynamic` export on `login/page.tsx` is dead code.

**M4 — `camel<T>()` is an unsound type cast; Drizzle ORM (already a dependency) would eliminate it**
File: `src/lib/supabase/admin.ts`
`as T` bypasses structural type checking. Drizzle's `.$inferSelect` types + ORM query builder (already installed) would return properly typed results without any cast.

**M5 — Sequential DB queries in `createReport` can be parallelised**
File: `src/app/actions/reports.ts`
The report-count check and subscription check are independent — wrap both in `Promise.all`.

**M6 — `Toaster` component defined but never rendered; `next-themes` used only there**
File: `src/components/ui/sonner.tsx`
Toast notifications (`sonner`) are never displayed because `<Toaster />` is never mounted in any layout. Wire it into `(app)/layout.tsx` or remove the dead file.

**M7 — Vitest configuration has no mocks for `next/headers`, `next/navigation`, `next/cache`**
File: `vitest.config.ts`
Any attempt to test a Server Action will fail because `revalidatePath` (from `next/cache`), `cookies()` (from `next/headers`), and `redirect()` (from `next/navigation`) do not resolve in a plain Node environment. Add a `setupFiles` entry with `vi.mock()` stubs for all three.

---

### LOW

**L1 — `serverExternalPackages` not configured — `@react-pdf/renderer` bundled into server bundle**
File: `next.config.ts`
Without `serverExternalPackages: ['@react-pdf/renderer', 'postgres']`, Next.js attempts to bundle these Node-only modules, increasing cold-start time and risking webpack bundling failures.

**L2 — Sentry `org`/`project` hardcoded in `next.config.ts`**
Should be `process.env.SENTRY_ORG` and `process.env.SENTRY_PROJECT` for portability and to avoid leaking internal identifiers in a public repo.

**L3 — TypeScript `target: "ES2017"` is unnecessarily conservative for Next.js 16 + Node 22**
`ES2022` or higher matches the actual runtime target and brings proper type-level support for `Object.fromEntries`, `Array.at()`, and other modern idioms used throughout the codebase.

**L4 — `SEVERITY_COLOURS`/`SEVERITY_BORDER_COLOURS` in `utils.ts` are dead exports (Tailwind v4)**
These Tailwind class name maps are not referenced anywhere in the codebase. App uses CSS custom properties for severity styling. Remove to reduce confusion.

**L5 — `export const dynamic = 'force-dynamic'` on login page is redundant (covered by M3)**

---

## CI/CD & DevOps Findings

### CRITICAL

**C1 — No CI/CD pipeline — every push to `main` deploys untested, unlinted code to production**
No `.github/` directory exists. No branch protection. Vercel's auto-deploy means every push goes live immediately. Recommended minimal `ci.yml` (full YAML provided by agent): secret-scan (gitleaks) → dependency audit (`pnpm audit`) → quality gate (tsc + lint + test + build) → Vercel preview deploy (PRs) → Vercel production deploy (main). Required GitHub secrets: `VERCEL_TOKEN`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_SENTRY_DSN`, preview Supabase credentials.

**C2 — No database migration step before deploy — code can deploy ahead of schema**
`supabase/migrations/20260525000000_add_affected_component.sql` exists but is never run automatically. If code referencing a column deploys before the migration runs, production hits `column does not exist` errors immediately. Add a `migrate` job to CI using `pnpm db:migrate` with `DATABASE_URL_DIRECT` (port 5432 direct connection — not the pooler) before `deploy-production`.

**C3 — Supavisor connection pooling not configured — direct Postgres connection in production**
Files: `src/lib/db/index.ts`, `drizzle.config.ts`, `.env.local.example`
`.env.local.example` describes `DATABASE_URL` as "direct url". Direct connections (port 5432) create a new Postgres connection per Vercel Function invocation. Under moderate load (20+ concurrent users), this hits Supabase's connection limit and returns `too many clients` for all users. Two env vars required: `DATABASE_URL` (Supavisor pooler, port 6543) for runtime queries, `DATABASE_URL_DIRECT` (port 5432) for Drizzle migrations only.

---

### HIGH

**H1 — `SENTRY_AUTH_TOKEN` and `NEXT_PUBLIC_SENTRY_DSN` missing from `.env.local.example`**
Without `SENTRY_AUTH_TOKEN` in Vercel's build environment, source maps are not uploaded — all production stack traces are minified/unreadable. Update `.env.local.example` and Vercel environment variables.

**H2 — PDF export route has no `maxDuration` — will hit Vercel Function timeout on large reports**
`@react-pdf/renderer` can take 30–60s on complex reports. Vercel Hobby timeout is 10s; Pro is 15s (default). Create `vercel.json` with `"maxDuration": 60` for the export route (requires Pro plan). Also add `export const runtime = 'nodejs'` to the export route and the Stripe webhook explicitly.

**H3 — Preview deployments use production data and live Stripe keys**
No environment isolation between preview and production. Fix: separate Supabase project (or Supabase branching) for preview; use `sk_test_...` Stripe key scoped to Vercel Preview environment.

**H4 — No secret scanning (gitleaks) — high-value secrets could reach git history undetected**
Addressed by CI/CD C1 (gitleaks job as first gate in the workflow).

**H5 — `pnpm audit` never run — known vulnerabilities exist in dependency tree**
`pnpm-workspace.yaml` overrides confirm two existing vulnerable packages. Addressed by CI/CD C1 (audit job in workflow) + Dependabot configuration.

---

### MEDIUM

**M1 — Sentry Session Replay initialises pre-consent (GDPR/UK PECR violation)**
`instrumentation-client.ts` unconditionally initialises `replayIntegration()`. Defer replay initialization behind a consent callback or remove entirely until a consent mechanism exists. Error capture works independently of replay.

**M2 — `lint` script lints nothing — `"eslint"` with no target path**
`package.json` `scripts.lint` is `"eslint"` with no file argument. In ESLint 9, this may lint nothing or error. Change to `"next lint"` or `"eslint src/ --max-warnings=0"`.

**M3 — No rate limiting on PDF export or auth endpoints**
Lowest-friction fix: Vercel Firewall rules in `vercel.json` for rate-limiting the export route (5 req/60s per IP). For auth: Supabase's built-in rate limiting handles `signIn`/`signUp`; add Upstash Rate Limit for server actions.

**M4 — No Sentry alert rules configured**
Three rules to create in Sentry dashboard: (1) any new issue → email; (2) error spike (>10/min) → email; (3) webhook transaction errors → email.

**M5 — PDF export route not pinned to `runtime = 'nodejs'`**
`@react-pdf/renderer` is Node.js-only. Without explicit `export const runtime = 'nodejs'`, a future Next.js config change could route it to edge.

**M6 — `next.config.ts` hardcodes Sentry `org`/`project` (duplicate of Framework L2)**

**M7 — Supabase connection pooling env var architecture not documented in README or `.env.local.example`**

---

### LOW

**L1 — README instructs `db:push` for initial setup — unsafe outside local dev**
Add a note distinguishing `db:push` (local dev, destructive, no migration file) from `db:migrate` (production-safe).

**L2 — Single migration file with no baseline schema migration — `drizzle_migrations` journal integrity uncertain**
Original tables were created via `db:push` (no migration file). Run `pnpm db:generate --name=baseline` to generate, then mark as applied if tables already exist.

**L3 — Sentry wizard error log files committed to repo root**
`sentry-wizard-installation-error-*.log` should be gitignored and deleted.

**L4 — No go-live runbook — rollback, secret rotation, Stripe webhook re-registration undocumented**
Minimum for June 5: document Vercel rollback procedure (Deployments tab → Promote to Production), Supabase PITR status, Stripe webhook secret location.

