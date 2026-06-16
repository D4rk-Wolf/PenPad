# Self-Hosted Packaging (Sub-project 0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make "paid = self-hosted only": cloud (penpad.co.uk) becomes a 30-day full-Pro trial then free; a Stripe purchase provisions a Keygen license (delivered + lifecycle-synced) instead of granting cloud Pro.

**Architecture:** Cloud entitlement is trial-based (`auth_user.trial_ends_at`), read through the existing `getMySubscription()` so all `status==='active'`/`isPro` call sites keep working. A Stripe subscription no longer grants cloud Pro — its webhook creates/suspends a Keygen license. Self-hosted licensing (PR #18) is unchanged; we only add the provisioning (admin) side.

**Tech Stack:** Next.js 16 / React 19, Drizzle ORM (dual lineage: Supabase SQL migrations for cloud + `drizzle.config.selfhosted.ts` baseline for Docker), better-auth, Stripe, Keygen.sh REST API, Resend, vitest. Spec: `docs/superpowers/specs/2026-06-16-self-hosted-packaging-design.md`.

**Branch:** `feat/self-hosted-packaging` (already created; spec committed).

**Inert-until-configured rule:** Keygen provisioning must no-op with a clear log (never throw to the user) when `KEYGEN_API_TOKEN`/`KEYGEN_POLICY_ID` are unset. Do NOT merge to prod from this plan — stop at branch + verification (Keygen account must exist first).

---

## File Structure

```
src/lib/db/auth-schema.ts          MODIFY  + trialEndsAt column on authUser
src/lib/db/schema.ts               MODIFY  + keygenLicenseId, licenseKey on subscriptions
supabase/migrations/2026..._self_hosted_packaging.sql   CREATE  cloud DDL + backfill
drizzle/ (selfhosted baseline)     REGEN   drizzle-kit generate --config drizzle.config.selfhosted.ts
src/lib/entitlement.ts             CREATE  trial-aware Pro check (single source of truth)
src/lib/subscriptions.ts           MODIFY  cloud branch → trial-based; expose trialEndsAt
src/lib/auth/index.ts              MODIFY  databaseHooks.user.create.after → set trial_ends_at
src/lib/keygen.ts                  MODIFY  + createProLicense / suspendLicense / reinstateLicense
src/app/actions/reports.ts         MODIFY  isPro via entitlement, not raw subscriptions query
src/app/(app)/reports/[id]/export/route.tsx  MODIFY  isPro via entitlement
src/app/api/stripe/webhook/route.ts MODIFY  provision/suspend/reinstate Keygen license + email
src/lib/email/license.ts           CREATE  Resend license-delivery email
src/app/(app)/settings/license/page.tsx  MODIFY  cloud buyer view (key + Docker quickstart + trial)
src/components/layout/trial-banner.tsx   CREATE  countdown banner (cloud only)
src/app/(app)/layout.tsx           MODIFY  mount TrialBanner
src/components/reports/export-action.tsx MODIFY  reframe copy → "Get Pro (self-hosted)"
.env.local.example                 MODIFY  + KEYGEN_API_TOKEN, KEYGEN_POLICY_ID
```

Run all commands from `/home/turkish/Documents/D4rkWolf/studios/products/PenPad`. Test runner: `pnpm test` (vitest). Build: `pnpm build`. Lint: `pnpm lint`.

---

### Task 1: Schema — trial + license columns (both migration lineages)

**Files:** Modify `src/lib/db/auth-schema.ts`, `src/lib/db/schema.ts`; Create `supabase/migrations/20260616120000_self_hosted_packaging.sql`; Regenerate self-hosted drizzle baseline.

- [ ] **Step 1: Add `trialEndsAt` to the Drizzle auth-schema**

In `src/lib/db/auth-schema.ts`, add to the `authUser` pgTable definition (after `updated_at`):
```ts
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
```
Ensure `timestamp` is in the `drizzle-orm/pg-core` import.

- [ ] **Step 2: Add Keygen columns to `subscriptions` in `src/lib/db/schema.ts`**

Add to the `subscriptions` pgTable (after `currentPeriodEnd`):
```ts
  keygenLicenseId: text('keygen_license_id'),
  licenseKey:      text('license_key'),
```

- [ ] **Step 3: Write the cloud Supabase migration**

Create `supabase/migrations/20260616120000_self_hosted_packaging.sql`:
```sql
-- Self-hosted packaging: cloud trial + Keygen license storage.
ALTER TABLE public.auth_user     ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS keygen_license_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS license_key       text;

-- Backfill existing users with a fresh 30-day trial so nobody locks instantly.
UPDATE public.auth_user
SET trial_ends_at = now() + interval '30 days'
WHERE trial_ends_at IS NULL;
```

- [ ] **Step 4: Apply the cloud migration to the live Supabase project**

Apply via the Supabase MCP `apply_migration` (project_id `vtdmtnpsybqmcgtdvblu`, name `self_hosted_packaging`) using the SQL above. Then verify:
```sql
select column_name from information_schema.columns
where table_schema='public' and table_name='auth_user' and column_name='trial_ends_at';
select count(*) as users, count(trial_ends_at) as with_trial from public.auth_user;
```
Expected: `trial_ends_at` present; `with_trial` == `users` (all 5 backfilled).

- [ ] **Step 5: Regenerate the self-hosted drizzle baseline**

Run: `pnpm drizzle-kit generate --config drizzle.config.selfhosted.ts`
Expected: a new migration file appears under `drizzle/` adding the three columns; `drizzle/meta/_journal.json` updated. (This keeps fresh self-hosted Docker DBs in sync.)

- [ ] **Step 6: Verify build + commit**

Run: `pnpm tsc --noEmit 2>&1 | grep -E "error TS" | grep -v "validator.ts" || echo CLEAN`
Expected: `CLEAN` (the pre-existing `.next/types/validator.ts` error is unrelated).
```bash
git add src/lib/db/auth-schema.ts src/lib/db/schema.ts supabase/migrations/20260616120000_self_hosted_packaging.sql drizzle/
git commit -m "feat(packaging): add trial_ends_at + keygen license columns (cloud + self-hosted migrations)"
```

---

### Task 2: Trial-aware entitlement (single source of truth)

**Files:** Create `src/lib/entitlement.ts`; Modify `src/lib/subscriptions.ts`; Test `src/lib/__tests__/entitlement.test.ts`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/entitlement.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { isProFromTrial } from '@/lib/entitlement'

describe('isProFromTrial', () => {
  it('is Pro when trial_ends_at is in the future', () => {
    expect(isProFromTrial(new Date(Date.now() + 86_400_000))).toBe(true)
  })
  it('is not Pro when trial_ends_at is in the past', () => {
    expect(isProFromTrial(new Date(Date.now() - 86_400_000))).toBe(false)
  })
  it('is not Pro when trial_ends_at is null', () => {
    expect(isProFromTrial(null)).toBe(false)
  })
})
```

- [ ] **Step 2: Run it; expect failure**

Run: `pnpm test entitlement 2>&1 | tail -15`
Expected: FAIL — cannot find module `@/lib/entitlement`.

- [ ] **Step 3: Implement `src/lib/entitlement.ts`**

```ts
import 'server-only'

/** Cloud Pro is granted only by an active trial window. */
export function isProFromTrial(trialEndsAt: Date | null | undefined): boolean {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt).getTime() > Date.now()
}
```

- [ ] **Step 4: Run it; expect pass**

Run: `pnpm test entitlement 2>&1 | tail -15`
Expected: 3 passed.

- [ ] **Step 5: Route cloud entitlement through the trial in `subscriptions.ts`**

In `src/lib/subscriptions.ts`, the cloud branch (after `isSelfHosted()`) currently returns the raw `subscriptions` row. Replace the cloud return so Pro is trial-derived. Fetch the user's `trial_ends_at` and return a synthetic subscription whose `status` reflects the trial, while still surfacing any stored license fields:
```ts
  const user = await getCurrentUser()
  if (!user) return null

  const [row] = await db
    .select({ trialEndsAt: authUser.trialEndsAt })
    .from(authUser)
    .where(eq(authUser.id, user.id))
    .limit(1)

  const pro = isProFromTrial(row?.trialEndsAt ?? null)
  return {
    id: 'cloud',
    userId: user.id,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    status: pro ? 'active' : 'inactive',
    currentPeriodEnd: row?.trialEndsAt ?? null,
    updatedAt: new Date(),
  }
```
Add imports: `authUser` from `@/lib/db/auth-schema`, `isProFromTrial` from `@/lib/entitlement`. Keep the `Subscription` return type. (Note: this intentionally stops reading the Stripe `subscriptions` table for cloud Pro.)

- [ ] **Step 6: Add a `getTrialEndsAt()` helper for the banner**

Append to `src/lib/subscriptions.ts`:
```ts
export const getTrialEndsAt = cache(async (): Promise<Date | null> => {
  if (isSelfHosted()) return null
  const user = await getCurrentUser()
  if (!user) return null
  const [row] = await db
    .select({ trialEndsAt: authUser.trialEndsAt })
    .from(authUser).where(eq(authUser.id, user.id)).limit(1)
  return row?.trialEndsAt ?? null
})
```

- [ ] **Step 7: Repoint direct subscription reads to entitlement**

`src/app/actions/reports.ts` (createReport) computes `isPro` from a raw `subscriptions` query. Replace that query + `isPro` derivation with `const sub = await getMySubscription(); const isPro = sub?.status === 'active'` (import `getMySubscription` from `@/lib/subscriptions`; drop the now-unused subscriptions select). Do the same in `src/app/(app)/reports/[id]/export/route.tsx` (replace the `subscriptions` select + `sub?.status !== 'active'` guard with `const sub = await getMySubscription()`). Leave the `pdf_export_blocked` capture in place.

- [ ] **Step 8: Verify + commit**

Run: `pnpm test 2>&1 | tail -15` (expect all pass) and `pnpm tsc --noEmit 2>&1 | grep -E "error TS" | grep -v validator.ts || echo CLEAN`.
```bash
git add src/lib/entitlement.ts src/lib/subscriptions.ts src/lib/__tests__/entitlement.test.ts src/app/actions/reports.ts "src/app/(app)/reports/[id]/export/route.tsx"
git commit -m "feat(packaging): trial-based cloud entitlement via getMySubscription"
```

---

### Task 3: Set trial on signup

**Files:** Modify `src/lib/auth/index.ts`.

- [ ] **Step 1: Add the create-after hook**

In `src/lib/auth/index.ts`, add a `databaseHooks` block to the `betterAuth({...})` config (sibling of `advanced`). It sets `trial_ends_at` 30 days out for each newly created user:
```ts
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db
            .update(authUser)
            .set({ trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
            .where(eq(authUser.id, user.id))
        },
      },
    },
  },
```
Add imports if missing: `eq` from `drizzle-orm`. (`db` and `authUser` are already imported.)

- [ ] **Step 2: Verify the hook signature against better-auth**

Run: `grep -rn "databaseHooks" node_modules/better-auth/dist/**/*.d.ts 2>/dev/null | head` to confirm the `user.create.after(user)` shape. If the installed better-auth exposes a different hook name/signature, match it (the intent: run a side-effect after a user row is created, receiving the user with its `id`). Adjust the code to the real signature; do not invent one.

- [ ] **Step 3: Verify + commit**

Run: `pnpm tsc --noEmit 2>&1 | grep -E "error TS" | grep -v validator.ts || echo CLEAN` → `CLEAN`.
```bash
git add src/lib/auth/index.ts
git commit -m "feat(packaging): grant new signups a 30-day cloud Pro trial"
```

---

### Task 4: Keygen provisioning library

**Files:** Modify `src/lib/keygen.ts` (currently `license.ts` holds validate; add an admin module). Create `src/lib/keygen.ts`; Test `src/lib/__tests__/keygen.test.ts`.

- [ ] **Step 1: Write the failing test (mocked fetch)**

Create `src/lib/__tests__/keygen.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.stubEnv('KEYGEN_ACCOUNT_ID', 'acct-test')
  vi.stubEnv('KEYGEN_API_TOKEN', 'tok-test')
  vi.stubEnv('KEYGEN_POLICY_ID', 'pol-test')
  vi.restoreAllMocks()
})

it('createProLicense returns id + key on success', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(
    JSON.stringify({ data: { id: 'lic_1', attributes: { key: 'KEY-123' } } }),
    { status: 201, headers: { 'Content-Type': 'application/vnd.api+json' } },
  )))
  const { createProLicense } = await import('@/lib/keygen')
  const res = await createProLicense({ email: 'a@b.co', stripeCustomerId: 'cus_1', userId: 'u1' })
  expect(res).toEqual({ licenseId: 'lic_1', licenseKey: 'KEY-123' })
})

it('createProLicense returns null when unconfigured', async () => {
  vi.stubEnv('KEYGEN_API_TOKEN', '')
  const { createProLicense } = await import('@/lib/keygen')
  expect(await createProLicense({ email: 'a@b.co', stripeCustomerId: 'c', userId: 'u' })).toBeNull()
})
```

- [ ] **Step 2: Run; expect fail** — `pnpm test keygen 2>&1 | tail -15` → cannot find `@/lib/keygen`.

- [ ] **Step 3: Implement `src/lib/keygen.ts`**

```ts
import 'server-only'

const ACCOUNT = process.env.KEYGEN_ACCOUNT_ID ?? ''
const TOKEN = process.env.KEYGEN_API_TOKEN ?? ''
const POLICY = process.env.KEYGEN_POLICY_ID ?? ''
const BASE = `https://api.keygen.sh/v1/accounts/${ACCOUNT}`

function configured(): boolean {
  return Boolean(ACCOUNT && TOKEN && POLICY)
}

async function admin(path: string, body: unknown): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(body),
  })
}

export async function createProLicense(
  { email, stripeCustomerId, userId }: { email: string; stripeCustomerId: string; userId: string },
): Promise<{ licenseId: string; licenseKey: string } | null> {
  if (!configured()) {
    console.warn('[keygen] not configured — skipping license creation')
    return null
  }
  const res = await admin('/licenses', {
    data: {
      type: 'licenses',
      attributes: { metadata: { tier: 'pro', email, stripeCustomerId, userId } },
      relationships: { policy: { data: { type: 'policies', id: POLICY } } },
    },
  })
  if (!res.ok) {
    console.error('[keygen] createProLicense failed:', res.status, await res.text())
    return null
  }
  const json = await res.json()
  const licenseId = json?.data?.id
  const licenseKey = json?.data?.attributes?.key
  if (!licenseId || !licenseKey) return null
  return { licenseId, licenseKey }
}

export async function suspendLicense(licenseId: string): Promise<void> {
  if (!configured() || !licenseId) return
  const res = await admin(`/licenses/${licenseId}/actions/suspend`, {})
  if (!res.ok) console.error('[keygen] suspend failed:', res.status, await res.text())
}

export async function reinstateLicense(licenseId: string): Promise<void> {
  if (!configured() || !licenseId) return
  const res = await admin(`/licenses/${licenseId}/actions/reinstate`, {})
  if (!res.ok) console.error('[keygen] reinstate failed:', res.status, await res.text())
}
```
> Verify the Keygen request/response shapes against current Keygen docs (https://keygen.sh/docs/api/) before relying on field paths (`data.id`, `data.attributes.key`); adjust if their API differs. Keep the `configured()` no-op behavior.

- [ ] **Step 4: Run; expect pass** — `pnpm test keygen 2>&1 | tail -15` → 2 passed.

- [ ] **Step 5: Commit**
```bash
git add src/lib/keygen.ts src/lib/__tests__/keygen.test.ts
git commit -m "feat(packaging): Keygen license provisioning (create/suspend/reinstate), inert until configured"
```

---

### Task 5: Webhook — provision + lifecycle-sync the license

**Files:** Modify `src/app/api/stripe/webhook/route.ts`; Create `src/lib/email/license.ts`.

- [ ] **Step 1: License-delivery email**

Create `src/lib/email/license.ts` — a Resend send with the key + Docker quickstart. Follow the existing Resend usage in the repo (search `grep -rn "resend\|Resend" src/lib src/app | grep -iv node_modules` and mirror the client/init pattern; if none exists, use `import { Resend } from 'resend'` with `process.env.RESEND_API_KEY`, no-op when unset):
```ts
import 'server-only'
import { Resend } from 'resend'

export async function sendLicenseEmail(to: string, licenseKey: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) { console.warn('[email] RESEND_API_KEY unset — skipping license email'); return }
  const resend = new Resend(key)
  const from = process.env.LICENSE_EMAIL_FROM ?? 'PenPad <noreply@penpad.co.uk>'
  const quickstart = [
    'Your PenPad Pro license is ready. Run it self-hosted:',
    '',
    '  docker run -e PENPAD_LICENSE_KEY=' + licenseKey + ' -p 3000:3000 ghcr.io/d4rk-wolf/penpad:latest',
    '',
    'Full setup: https://penpad.co.uk/docs/self-hosting',
  ].join('\n')
  try {
    await resend.emails.send({ from, to, subject: 'Your PenPad Pro license', text: quickstart })
  } catch (err) {
    console.error('[email] license email failed:', err)
  }
}
```
> Confirm `resend` is installed (`grep '"resend"' package.json`); if not, `pnpm add -w resend`. Confirm the Docker image path against the repo's existing Dockerfile/README; fix if different.

- [ ] **Step 2: Provision on `checkout.session.completed`**

In the webhook's `checkout.session.completed` case, after the subscription row is upserted, add license provisioning guarded by idempotency (only if no license stored yet):
```ts
        // Provision a self-hosted Keygen license (paid = self-hosted).
        const [existing] = await db
          .select({ keygenLicenseId: subscriptions.keygenLicenseId })
          .from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1)
        if (!existing?.keygenLicenseId) {
          const license = await createProLicense({ email: foundUser.email ?? '', stripeCustomerId, userId })
          if (license) {
            await db.update(subscriptions)
              .set({ keygenLicenseId: license.licenseId, licenseKey: license.licenseKey, updatedAt: new Date() })
              .where(eq(subscriptions.userId, userId))
            if (foundUser.email) await sendLicenseEmail(foundUser.email, license.licenseKey)
          }
        }
```
Add imports: `createProLicense` from `@/lib/keygen`, `sendLicenseEmail` from `@/lib/email/license`. Remove the previously-added `subscription_started` PostHog capture only if it conflicts — otherwise keep it.

- [ ] **Step 3: Lifecycle → license suspend/reinstate**

In the `customer.subscription.deleted` / `paused` and `invoice.payment_failed` handling, after updating the row's status, look up `keygenLicenseId` for that subscription and call `suspendLicense(id)` when the new status is not active; in `customer.subscription.updated` call `reinstateLicense(id)` when status becomes `active`. Import `suspendLicense, reinstateLicense` from `@/lib/keygen`. Guard all with `if (id)`.

- [ ] **Step 4: Verify + commit**

Run: `pnpm test 2>&1 | tail -15` and `pnpm tsc --noEmit 2>&1 | grep "error TS" | grep -v validator.ts || echo CLEAN`.
```bash
git add src/app/api/stripe/webhook/route.ts src/lib/email/license.ts package.json pnpm-lock.yaml
git commit -m "feat(packaging): provision + lifecycle-sync Keygen license from Stripe webhook"
```

---

### Task 6: License page — cloud buyer view

**Files:** Modify `src/app/(app)/settings/license/page.tsx`.

- [ ] **Step 1: Show the purchased key + Docker quickstart on cloud**

Rework the `!isSelfHosted()` branch. Instead of "cloud users don't need a license," fetch the user's stored `licenseKey` via `getMySubscription()` (the row now carries `licenseKey` after purchase — expose it on the returned shape, or add a small `getCloudLicenseKey()` to `subscriptions.ts` that selects `subscriptions.licenseKey` for the user). Render:
- If `licenseKey` present: a card with the key (monospace, copy button — reuse existing button styles), subscription status, and a Docker quickstart code block (`PENPAD_LICENSE_KEY=<key>`), plus a link to `/docs/self-hosting`.
- Else: the trial status (use `getTrialEndsAt()` → "N days left in your Pro trial" or "Trial ended") and a "Get PenPad Pro (self-hosted)" button (a `<form action={startProCheckout}>` from `@/app/actions/billing`).
Keep the self-hosted branch as-is.

- [ ] **Step 2: Verify + commit**

Run: `pnpm build 2>&1 | tail -5` (expect success).
```bash
git add "src/app/(app)/settings/license/page.tsx" src/lib/subscriptions.ts
git commit -m "feat(packaging): cloud license page shows purchased key + Docker quickstart / trial status"
```

---

### Task 7: Trial banner + reframed upgrade modal

**Files:** Create `src/components/layout/trial-banner.tsx`; Modify `src/app/(app)/layout.tsx`, `src/components/reports/export-action.tsx`.

- [ ] **Step 1: Trial banner (server component)**

Create `src/components/layout/trial-banner.tsx`, mirroring `update-banner.tsx`'s style. Cloud-only; hidden when self-hosted or no trial. Shows days remaining and a self-host CTA:
```tsx
import { isSelfHosted } from '@/lib/license'
import { getTrialEndsAt } from '@/lib/subscriptions'
import Link from 'next/link'

export async function TrialBanner() {
  if (isSelfHosted()) return null
  const ends = await getTrialEndsAt()
  if (!ends) return null
  const days = Math.ceil((new Date(ends).getTime() - Date.now()) / 86_400_000)
  if (days > 0) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 text-center">
        {days} day{days === 1 ? '' : 's'} of Pro left — keep PenPad by self-hosting.{' '}
        <Link href="/settings/license" className="underline font-medium">Get Pro</Link>
      </div>
    )
  }
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 text-center">
      Your Pro trial has ended.{' '}
      <Link href="/settings/license" className="underline font-medium">Get PenPad Pro (self-hosted)</Link>
    </div>
  )
}
```

- [ ] **Step 2: Mount it** in `src/app/(app)/layout.tsx` next to `<UpdateBanner />`:
```tsx
      <TrialBanner />
```
Import: `import { TrialBanner } from '@/components/layout/trial-banner'`.

- [ ] **Step 3: Reframe the upgrade modal copy** in `src/components/reports/export-action.tsx`

Change the modal title/description/benefits/CTA so it sells the self-hosted license, not cloud PDF: title → "Get PenPad Pro — self-hosted"; description → "PDF export is a Pro feature. Pro runs self-hosted so your clients' data stays on your infrastructure. £49/mo, cancel anytime."; keep the benefit bullets but add "Runs on your own server (Docker) — your data never leaves your infra"; CTA label stays "Upgrade to Pro — £49/mo". The `startProCheckout` action + `upgrade_cta_clicked` capture are unchanged. (Note: during an active trial users are Pro, so the modal won't render anyway — this copy is for post-trial.)

- [ ] **Step 4: Verify + commit**

Run: `pnpm build 2>&1 | tail -5` (success) and `pnpm lint 2>&1 | tail -5`.
```bash
git add src/components/layout/trial-banner.tsx "src/app/(app)/layout.tsx" src/components/reports/export-action.tsx
git commit -m "feat(packaging): trial-countdown banner + self-hosted upgrade modal copy"
```

---

### Task 8: Env example + final verification

**Files:** Modify `.env.local.example`.

- [ ] **Step 1: Document the new env**

In `.env.local.example`, under a Keygen section (the validate path already implies `KEYGEN_ACCOUNT_ID`), add:
```
# ─── Keygen (licensing — required for paid/self-hosted) ─────────────────────────
KEYGEN_ACCOUNT_ID=
KEYGEN_API_TOKEN=
KEYGEN_POLICY_ID=
# Optional license-email sender
LICENSE_EMAIL_FROM=PenPad <noreply@penpad.co.uk>
```

- [ ] **Step 2: Full verification**

Run, expecting success/clean:
```bash
pnpm test 2>&1 | tail -10
pnpm lint 2>&1 | tail -5
pnpm build 2>&1 | tail -8
```

- [ ] **Step 3: Final commit**
```bash
git add .env.local.example
git commit -m "docs(packaging): document Keygen + license-email env vars"
```

- [ ] **Step 4: STOP — do not merge/deploy.** Report branch state + the go-live checklist (Connor creates Keygen account + Pro policy, sets `KEYGEN_*` env in Vercel, then merge). Production deploy is a deliberate, separate step.

---

## Notes for the implementer
- **Inert-until-configured:** every Keygen + Resend call must no-op with a clear `console.warn`/`console.error` when env is missing — never throw to the user or 500 the webhook.
- **Dual migrations:** schema changes land in the Supabase SQL migration (cloud, applied via MCP) AND the self-hosted drizzle baseline (`drizzle-kit generate --config drizzle.config.selfhosted.ts`). Don't skip either.
- **Don't reintroduce cloud-Pro-via-Stripe:** after this, no code path may grant cloud Pro from the `subscriptions` table — only the trial does.
- **Verify external API shapes** (Keygen JSON, better-auth hook signature, Resend API) against the installed package / live docs before trusting field names; adjust to reality rather than fabricate.
- This plan stops at a verified branch. Merging/deploying happens only after Keygen is set up.
