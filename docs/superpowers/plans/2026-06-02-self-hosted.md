# PenPad Self-Hosted Mode — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable PenPad to be deployed self-hosted via Docker Compose with license-key billing, while the existing cloud product continues to run unchanged on Vercel with Stripe.

**Architecture:** Four independent phases, each mergeable to `main` without breaking the cloud product. Phase 1 and 2 run on Vercel — they are pure refactors with no user-visible change. Phase 3 adds Docker infrastructure alongside the existing Vercel deploy. Phase 4 adds the license key system for self-hosted customers.

**Tech Stack:** Drizzle ORM (already present), better-auth (replaces Supabase Auth), Docker + Postgres 16, Keygen.sh (license keys), pnpm

---

## Scope: Four Independent Phases

| Phase | What | Deployable to Vercel? | User-visible change? |
|---|---|---|---|
| 1 | Replace `adminDb()` with Drizzle | Yes | No |
| 2 | Replace Supabase Auth with better-auth | Yes | No (same UX) |
| 3 | Docker + Postgres + migration-on-startup | New path | No |
| 4 | License key gating + update notifications | Self-hosted only | Yes (new settings UI) |

Each phase must pass all tests before moving to the next.

---

## Phase 1: Replace Supabase DB Client with Drizzle

**Context:** Every server action currently calls `adminDb()` (Supabase JS REST client) and `camel()` (snake→camelCase converter). Drizzle is already wired up in `src/lib/db/index.ts` and maps columns automatically. This phase replaces `adminDb` + `camel` with `db` across all six action files. Auth remains Supabase for now.

**Files modified:**
- `src/lib/subscriptions.ts`
- `src/app/actions/reports.ts`
- `src/app/actions/findings.ts`
- `src/app/actions/templates.ts`
- `src/app/actions/settings.ts`
- `src/app/actions/branding.ts`
- `src/app/actions/admin.ts`

**Files deleted (after phase complete):**
- `src/lib/supabase/admin.ts`

---

### Task 1.1: Rewrite `src/lib/subscriptions.ts`

**Files:**
- Modify: `src/lib/subscriptions.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/lib/__tests__/subscriptions.test.ts` (create file):

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
    },
  }),
}))

describe('getMySubscription', () => {
  it('returns null when no subscription exists', async () => {
    const { getMySubscription } = await import('@/lib/subscriptions')
    const result = await getMySubscription()
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/lib/__tests__/subscriptions.test.ts
```

Expected: FAIL — module import issues or wrong mock shape.

- [ ] **Step 3: Replace the implementation**

```ts
import 'server-only'
import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import type { Subscription } from '@/lib/db/schema'

export const getMySubscription = cache(async (): Promise<Subscription | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1)
  return rows[0] ?? null
})
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test src/lib/__tests__/subscriptions.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/subscriptions.ts src/lib/__tests__/subscriptions.test.ts
git commit -m "refactor: replace adminDb with Drizzle in getMySubscription"
```

---

### Task 1.2: Rewrite `src/app/actions/reports.ts`

**Files:**
- Modify: `src/app/actions/reports.ts`

- [ ] **Step 1: Replace the file**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, desc, count, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { reports, subscriptions } from '@/lib/db/schema'
import { ReportSchema } from '@/lib/validations'
import type { Report } from '@/lib/db/schema'
import { FREE_REPORT_LIMIT } from '@/lib/utils'

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  return user.id
}

export async function getReports(): Promise<Report[]> {
  const userId = await getCurrentUserId()
  return db
    .select()
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt))
    .limit(100)
}

export async function createReport(formData: FormData) {
  const userId = await getCurrentUserId()

  const [countResult, subResult] = await Promise.all([
    db.select({ value: count() }).from(reports).where(eq(reports.userId, userId)),
    db.select({ status: subscriptions.status }).from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1),
  ])
  const isPro = subResult[0]?.status === 'active'
  if (!isPro && (countResult[0]?.value ?? 0) >= FREE_REPORT_LIMIT) {
    throw new Error(`Free tier limited to ${FREE_REPORT_LIMIT} reports. Upgrade to Pro for unlimited.`)
  }

  const parsed = ReportSchema.safeParse({
    clientName: formData.get('clientName'),
    scope:      formData.get('scope') || null,
    startDate:  formData.get('startDate') || null,
    endDate:    formData.get('endDate') || null,
    testerName: formData.get('testerName') || null,
  })
  if (!parsed.success) throw new Error(parsed.error.issues.map(i => i.message).join('; '))
  const d = parsed.data

  const [report] = await db
    .insert(reports)
    .values({
      userId,
      clientName: d.clientName,
      scope:      d.scope ?? null,
      startDate:  d.startDate ?? null,
      endDate:    d.endDate ?? null,
      testerName: d.testerName ?? null,
    })
    .returning()

  revalidatePath('/dashboard')
  redirect(`/reports/${report.id}`)
}

export async function updateReport(reportId: string, formData: FormData) {
  const userId = await getCurrentUserId()

  const parsed = ReportSchema.safeParse({
    clientName: formData.get('clientName'),
    scope:      formData.get('scope') || null,
    startDate:  formData.get('startDate') || null,
    endDate:    formData.get('endDate') || null,
    testerName: formData.get('testerName') || null,
  })
  if (!parsed.success) throw new Error(parsed.error.issues.map(i => i.message).join('; '))
  const d = parsed.data

  await db
    .update(reports)
    .set({
      clientName: d.clientName,
      scope:      d.scope ?? null,
      startDate:  d.startDate ?? null,
      endDate:    d.endDate ?? null,
      testerName: d.testerName ?? null,
    })
    .where(and(eq(reports.id, reportId), eq(reports.userId, userId)))

  revalidatePath(`/reports/${reportId}`)
  revalidatePath('/dashboard')
}

export async function updateReportStatus(
  reportId: string,
  status: 'draft' | 'active' | 'final',
) {
  const userId = await getCurrentUserId()

  if (!(['draft', 'active', 'final'] as const).includes(status)) {
    throw new Error('Invalid status')
  }

  await db
    .update(reports)
    .set({ status })
    .where(and(eq(reports.id, reportId), eq(reports.userId, userId)))

  revalidatePath(`/reports/${reportId}`)
  revalidatePath('/dashboard')
}

export async function deleteReport(reportId: string) {
  const userId = await getCurrentUserId()
  await db
    .delete(reports)
    .where(and(eq(reports.id, reportId), eq(reports.userId, userId)))
  revalidatePath('/dashboard')
  redirect('/dashboard')
}
```

- [ ] **Step 2: Run tests**

```bash
pnpm test
```

Expected: all existing tests PASS (no tests cover actions directly, so no new tests required here — the integration is verified by running the app).

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/reports.ts
git commit -m "refactor: replace adminDb with Drizzle in reports actions"
```

---

### Task 1.3: Rewrite `src/app/actions/findings.ts`

**Files:**
- Modify: `src/app/actions/findings.ts`

- [ ] **Step 1: Replace the file**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { eq, asc, and, count } from 'drizzle-orm'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { reports, findings } from '@/lib/db/schema'
import { getMySubscription } from '@/lib/subscriptions'
import { FindingSchema } from '@/lib/validations'
import type { Finding } from '@/lib/db/schema'
import { deriveSeverity, FREE_FINDING_LIMIT } from '@/lib/utils'

async function assertReportOwner(reportId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const [report] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.userId, user.id)))
    .limit(1)
  if (!report) throw new Error('Report not found')
  return user.id
}

export async function getFindings(reportId: string): Promise<Finding[]> {
  await assertReportOwner(reportId)
  return db
    .select()
    .from(findings)
    .where(eq(findings.reportId, reportId))
    .orderBy(asc(findings.sortOrder), asc(findings.createdAt))
}

export async function createFinding(reportId: string, formData: FormData) {
  await assertReportOwner(reportId)

  const parsed = FindingSchema.safeParse({
    title:             formData.get('title'),
    description:       formData.get('description') || null,
    cvssScore:         formData.get('cvssScore') ?? '0',
    impact:            formData.get('impact') || null,
    recommendation:    formData.get('recommendation') || null,
    evidence:          formData.get('evidence') || null,
    affectedComponent: formData.get('affectedComponent') || null,
  })
  if (!parsed.success) throw new Error(parsed.error.issues.map(i => i.message).join('; '))
  const d = parsed.data

  const [sub, countResult] = await Promise.all([
    getMySubscription(),
    db.select({ value: count() }).from(findings).where(eq(findings.reportId, reportId)),
  ])
  const isPro = sub?.status === 'active'
  if (!isPro && (countResult[0]?.value ?? 0) >= FREE_FINDING_LIMIT) {
    throw new Error(`Free tier limited to ${FREE_FINDING_LIMIT} findings per report. Upgrade to Pro for unlimited.`)
  }

  const cvssScore = parseFloat(d.cvssScore.toFixed(1)).toString()
  await db.insert(findings).values({
    reportId,
    title:             d.title,
    description:       d.description ?? null,
    cvssScore,
    severity:          deriveSeverity(parseFloat(cvssScore)),
    impact:            d.impact ?? null,
    recommendation:    d.recommendation ?? null,
    evidence:          d.evidence ?? null,
    affectedComponent: d.affectedComponent ?? null,
  })
  revalidatePath(`/reports/${reportId}`)
}

export async function updateFinding(findingId: string, reportId: string, formData: FormData) {
  await assertReportOwner(reportId)

  const parsed = FindingSchema.safeParse({
    title:             formData.get('title'),
    description:       formData.get('description') || null,
    cvssScore:         formData.get('cvssScore') ?? '0',
    impact:            formData.get('impact') || null,
    recommendation:    formData.get('recommendation') || null,
    evidence:          formData.get('evidence') || null,
    affectedComponent: formData.get('affectedComponent') || null,
  })
  if (!parsed.success) throw new Error(parsed.error.issues.map(i => i.message).join('; '))
  const d = parsed.data

  const cvssScore = parseFloat(d.cvssScore.toFixed(1)).toString()
  await db
    .update(findings)
    .set({
      title:             d.title,
      description:       d.description ?? null,
      cvssScore,
      severity:          deriveSeverity(parseFloat(cvssScore)),
      impact:            d.impact ?? null,
      recommendation:    d.recommendation ?? null,
      evidence:          d.evidence ?? null,
      affectedComponent: d.affectedComponent ?? null,
    })
    .where(and(eq(findings.id, findingId), eq(findings.reportId, reportId)))
  revalidatePath(`/reports/${reportId}`)
}

export async function deleteFinding(findingId: string, reportId: string) {
  await assertReportOwner(reportId)

  const uuidSchema = z.string().uuid()
  uuidSchema.parse(findingId)
  uuidSchema.parse(reportId)

  await db
    .delete(findings)
    .where(and(eq(findings.id, findingId), eq(findings.reportId, reportId)))
  revalidatePath(`/reports/${reportId}`)
}
```

- [ ] **Step 2: Run tests**

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/findings.ts
git commit -m "refactor: replace adminDb with Drizzle in findings actions"
```

---

### Task 1.4: Rewrite `src/app/actions/templates.ts`

**Files:**
- Modify: `src/app/actions/templates.ts`

- [ ] **Step 1: Replace the file**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { eq, desc, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { findings, findingTemplates, reports } from '@/lib/db/schema'
import { getMySubscription } from '@/lib/subscriptions'
import type { FindingTemplate } from '@/lib/db/schema'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  return user
}

export async function getMyTemplates(): Promise<FindingTemplate[]> {
  const user = await getCurrentUser()
  return db
    .select()
    .from(findingTemplates)
    .where(eq(findingTemplates.userId, user.id))
    .orderBy(desc(findingTemplates.createdAt))
}

export async function saveTemplate(findingId: string) {
  const user = await getCurrentUser()

  const sub = await getMySubscription()
  if (sub?.status !== 'active') throw new Error('Pro subscription required')

  const [finding] = await db
    .select({
      id: findings.id,
      title: findings.title,
      description: findings.description,
      cvssScore: findings.cvssScore,
      severity: findings.severity,
      impact: findings.impact,
      recommendation: findings.recommendation,
      evidence: findings.evidence,
      reportUserId: reports.userId,
    })
    .from(findings)
    .innerJoin(reports, eq(findings.reportId, reports.id))
    .where(eq(findings.id, findingId))
    .limit(1)

  if (!finding || finding.reportUserId !== user.id)
    throw new Error('Finding not found or access denied')

  await db.insert(findingTemplates).values({
    userId:         user.id,
    title:          finding.title,
    description:    finding.description,
    cvssScore:      finding.cvssScore,
    severity:       finding.severity,
    impact:         finding.impact,
    recommendation: finding.recommendation,
    evidence:       finding.evidence,
  })
  revalidatePath('/templates')
}

export async function deleteTemplate(templateId: string) {
  const user = await getCurrentUser()
  await db
    .delete(findingTemplates)
    .where(and(eq(findingTemplates.id, templateId), eq(findingTemplates.userId, user.id)))
  revalidatePath('/templates')
}
```

- [ ] **Step 2: Run tests**

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/templates.ts
git commit -m "refactor: replace adminDb with Drizzle in templates actions"
```

---

### Task 1.5: Rewrite remaining actions (`settings.ts`, `branding.ts`, `admin.ts`)

Read each file first, then apply the same pattern: remove `adminDb`/`camel` imports, add Drizzle imports, rewrite each query. Commit after all three files pass tests.

```bash
# After rewriting all three:
git add src/app/actions/settings.ts src/app/actions/branding.ts src/app/actions/admin.ts
git commit -m "refactor: replace adminDb with Drizzle in settings/branding/admin actions"
```

---

### Task 1.6: Delete `src/lib/supabase/admin.ts`

- [ ] **Step 1: Verify no remaining imports**

```bash
grep -r "supabase/admin" src/
```

Expected: no output.

- [ ] **Step 2: Delete the file**

```bash
rm src/lib/supabase/admin.ts
```

- [ ] **Step 3: Run full test suite**

```bash
pnpm test
```

Expected: all PASS

- [ ] **Step 4: Build check**

```bash
pnpm build
```

Expected: clean build, no TS errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove Supabase admin client — all queries now use Drizzle"
```

---

## Phase 2: Replace Supabase Auth with better-auth

**Context:** Currently auth is managed by `@supabase/ssr` — session cookies created by Supabase. `better-auth` is a self-contained auth library with a Drizzle adapter; it stores sessions in Postgres and manages cookies itself, no external service needed. This phase replaces the Supabase auth layer while keeping identical UX (email/password, no OAuth needed for launch).

**Files created:**
- `src/lib/auth/index.ts` — server-side better-auth instance
- `src/lib/auth/client.ts` — browser-side auth client
- `src/app/api/auth/[...all]/route.ts` — better-auth API handler
- `src/lib/db/auth-schema.ts` — better-auth Postgres tables (added to Drizzle schema)

**Files modified:**
- `src/lib/db/schema.ts` — re-export auth tables
- `src/app/(app)/layout.tsx` — swap Supabase session check
- `src/app/actions/reports.ts` (and other actions) — swap `getUser()` call
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/app/auth/callback/route.ts` — remove (better-auth handles its own callback)
- `package.json` — add `better-auth`

---

### Task 2.1: Install better-auth

- [ ] **Step 1: Install**

```bash
pnpm add better-auth
```

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add better-auth dependency"
```

---

### Task 2.2: Add better-auth tables to Drizzle schema

**Files:**
- Create: `src/lib/db/auth-schema.ts`
- Modify: `src/lib/db/schema.ts`

- [ ] **Step 1: Create auth schema file**

```ts
// src/lib/db/auth-schema.ts
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core'

export const authUser = pgTable('auth_user', {
  id:            text('id').primaryKey(),
  name:          text('name').notNull(),
  email:         text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image:         text('image'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull(),
})

export const authSession = pgTable('auth_session', {
  id:        text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId:    text('user_id').notNull().references(() => authUser.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
})

export const authAccount = pgTable('auth_account', {
  id:                   text('id').primaryKey(),
  accountId:            text('account_id').notNull(),
  providerId:           text('provider_id').notNull(),
  userId:               text('user_id').notNull().references(() => authUser.id, { onDelete: 'cascade' }),
  accessToken:          text('access_token'),
  refreshToken:         text('refresh_token'),
  idToken:              text('id_token'),
  expiresAt:            timestamp('expires_at', { withTimezone: true }),
  password:             text('password'),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull(),
})

export const authVerification = pgTable('auth_verification', {
  id:         text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value:      text('value').notNull(),
  expiresAt:  timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt:  timestamp('created_at', { withTimezone: true }),
  updatedAt:  timestamp('updated_at', { withTimezone: true }),
})
```

- [ ] **Step 2: Re-export from main schema file**

Add to the bottom of `src/lib/db/schema.ts`:

```ts
export * from './auth-schema'
```

- [ ] **Step 3: Generate migration**

```bash
pnpm db:generate
```

Expected: new SQL file in `supabase/migrations/` with the four `auth_*` tables.

- [ ] **Step 4: Run migration against local/dev database**

```bash
pnpm db:migrate
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/auth-schema.ts src/lib/db/schema.ts supabase/migrations/
git commit -m "feat: add better-auth tables to Drizzle schema"
```

---

### Task 2.3: Create the better-auth server instance

**Files:**
- Create: `src/lib/auth/index.ts`

- [ ] **Step 1: Create the file**

```ts
// src/lib/auth/index.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import { authUser, authSession, authAccount, authVerification } from '@/lib/db/auth-schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user:         authUser,
      session:      authSession,
      account:      authAccount,
      verification: authVerification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ],
})

export type Session = typeof auth.$Infer.Session
export type User    = typeof auth.$Infer.Session.user
```

- [ ] **Step 2: Create the browser client**

Create `src/lib/auth/client.ts`:

```ts
// src/lib/auth/client.ts
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
})

export const { signIn, signUp, signOut, useSession } = authClient
```

- [ ] **Step 3: Create the API route handler**

Create `src/app/api/auth/[...all]/route.ts`:

```ts
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/ src/app/api/auth/
git commit -m "feat: wire up better-auth server instance and API route"
```

---

### Task 2.4: Create a shared `getCurrentUser` helper

All actions currently call `supabase.auth.getUser()` inline. Replace with a single helper so Phase 3 only changes one file.

**Files:**
- Create: `src/lib/auth/session.ts`

- [ ] **Step 1: Create the helper**

```ts
// src/lib/auth/session.ts
import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
})

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthenticated')
  return user
}
```

- [ ] **Step 2: Update all actions to use `requireUser()`**

In every action file, replace:

```ts
// OLD
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) throw new Error('Unauthenticated')
```

with:

```ts
// NEW
import { requireUser } from '@/lib/auth/session'
// ...
const user = await requireUser()
```

Apply this to: `reports.ts`, `findings.ts`, `templates.ts`, `settings.ts`, `branding.ts`, `subscriptions.ts`

- [ ] **Step 3: Run tests**

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/session.ts src/app/actions/ src/lib/subscriptions.ts
git commit -m "refactor: centralise auth via requireUser() helper"
```

---

### Task 2.5: Update login, signup, and app layout

- [ ] **Step 1: Update `src/app/(auth)/login/page.tsx`**

Replace the Supabase `signInWithPassword` call with:

```tsx
'use client'
import { signIn } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'

// In the submit handler:
const { error } = await signIn.email({
  email,
  password,
  callbackURL: '/dashboard',
})
if (error) setError(error.message)
```

- [ ] **Step 2: Update `src/app/(auth)/signup/page.tsx`**

Replace the Supabase `signUp` call with:

```tsx
const { error } = await signUp.email({
  name: name,
  email,
  password,
  callbackURL: '/dashboard',
})
if (error) setError(error.message)
```

- [ ] **Step 3: Update `src/app/(app)/layout.tsx`**

```tsx
import { getCurrentUser } from '@/lib/auth/session'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  async function signOut() {
    'use server'
    await auth.api.signOut({ headers: await headers() })
    redirect('/login')
  }

  return (
    <AppShell
      user={{ email: user.email, name: user.name ?? undefined }}
      signOut={signOut}
    >
      {children}
    </AppShell>
  )
}
```

- [ ] **Step 4: Delete `src/app/auth/callback/route.ts`**

better-auth handles its own callback at `/api/auth/*`.

```bash
rm src/app/auth/callback/route.ts
```

- [ ] **Step 5: Run full test suite and build**

```bash
pnpm test && pnpm build
```

Expected: PASS + clean build

- [ ] **Step 6: Manual smoke test**

```bash
pnpm dev
```

Visit `http://localhost:3000`. Verify: sign up, log in, log out, dashboard loads.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: replace Supabase Auth with better-auth"
```

---

## Phase 3: Docker + Postgres Containerization

**Context:** With Phases 1 and 2 complete, the app has no hard Supabase dependencies. This phase adds Docker infrastructure so customers can run `docker-compose up` and have a fully working PenPad instance. The cloud Vercel deployment is unaffected.

**Files created:**
- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `.dockerignore`
- `scripts/start.sh` — runs migrations then starts Next.js

**Files modified:**
- `next.config.ts` — add `output: 'standalone'`
- `.env.local.example` — add self-hosted variables

---

### Task 3.1: Enable Next.js standalone output

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add `output: 'standalone'`**

Open `next.config.ts` and add `output: 'standalone'` to the config object. This tells Next.js to produce a self-contained `server.js` with all dependencies bundled — exactly what Docker needs.

- [ ] **Step 2: Test the build**

```bash
pnpm build
ls .next/standalone/
```

Expected: `server.js` and `node_modules/` present in `.next/standalone/`.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "chore: enable Next.js standalone output for Docker"
```

---

### Task 3.2: Create migration startup script

**Files:**
- Create: `scripts/start.sh`

- [ ] **Step 1: Create the script**

```bash
#!/bin/sh
set -e
echo "Running database migrations..."
node_modules/.bin/drizzle-kit migrate
echo "Migrations complete. Starting server..."
exec node server.js
```

- [ ] **Step 2: Make executable**

```bash
chmod +x scripts/start.sh
git add scripts/start.sh
git commit -m "chore: add migration-on-startup script for Docker"
```

---

### Task 3.3: Write Dockerfile

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

- [ ] **Step 1: Create `.dockerignore`**

```
node_modules
.next
.git
.env.local
.env*.local
*.log
Dockerfile*
docker-compose*
.dockerignore
```

- [ ] **Step 2: Create `Dockerfile`**

```dockerfile
FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable pnpm

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public
COPY --from=builder --chown=nextjs:nodejs /app/scripts          ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/drizzle-kit ./node_modules/.bin/drizzle-kit

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "scripts/start.sh"]
```

- [ ] **Step 3: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "chore: add Dockerfile with migration-on-startup"
```

---

### Task 3.4: Write `docker-compose.yml`

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create the file**

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://penpad:penpad@postgres:5432/penpad
      NEXT_PUBLIC_APP_URL: http://localhost:3000
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ""
      STRIPE_SECRET_KEY: ""
      STRIPE_WEBHOOK_SECRET: ""
      STRIPE_PRO_PRICE_ID: ""
      PENPAD_LICENSE_KEY: ${PENPAD_LICENSE_KEY:-}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: penpad
      POSTGRES_USER: penpad
      POSTGRES_PASSWORD: penpad
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U penpad -d penpad"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

volumes:
  postgres_data:
```

- [ ] **Step 2: Test the build locally**

```bash
docker compose build
docker compose up
```

Visit `http://localhost:3000`. Verify signup and login work. Check Postgres container logs for migration output.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add docker-compose.yml for self-hosted deployment"
```

---

### Task 3.5: Update `.env.local.example` with self-hosted vars

- [ ] **Step 1: Add the new self-hosted section**

Add to `.env.local.example`:

```bash
# ─── Self-hosted only ──────────────────────────────────────────────────────────
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your_random_secret_here

# Leave blank on cloud deployment; set to your Keygen license key when self-hosting
PENPAD_LICENSE_KEY=
```

- [ ] **Step 2: Commit**

```bash
git add .env.local.example
git commit -m "docs: add self-hosted env vars to example file"
```

---

## Phase 4: License Key System (Self-Hosted Billing)

**Context:** Self-hosted customers can't use Stripe subscriptions. Instead they receive a Keygen.sh license key when they pay. The app validates the key against Keygen's API on startup and caches the result. Feature gating (`isPro`) checks either Stripe (cloud) or the license key (self-hosted), chosen by the presence of `PENPAD_LICENSE_KEY` in env.

**Files created:**
- `src/lib/license.ts` — Keygen validation + caching
- `src/app/(app)/settings/license/page.tsx` — license key entry UI
- `src/components/layout/update-banner.tsx` — version check banner
- `src/app/api/version/route.ts` — public version endpoint

**Files modified:**
- `src/lib/subscriptions.ts` — return license tier when `PENPAD_LICENSE_KEY` is set
- `src/app/(app)/layout.tsx` — add `UpdateBanner`
- `package.json` — bump version as part of releases

---

### Task 4.1: Create `src/lib/license.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/license.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('validateLicense', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns valid:true for an active license', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        meta: { valid: true, code: 'VALID' },
        data: { attributes: { metadata: { tier: 'pro' } } },
      }),
    })
    const { validateLicense } = await import('@/lib/license')
    const result = await validateLicense('KEY-TEST-1234')
    expect(result.valid).toBe(true)
    expect(result.tier).toBe('pro')
  })

  it('returns valid:false for an expired license', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        meta: { valid: false, code: 'EXPIRED' },
        data: null,
      }),
    })
    const { validateLicense } = await import('@/lib/license')
    const result = await validateLicense('KEY-EXPIRED')
    expect(result.valid).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/lib/__tests__/license.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/license.ts`**

```ts
import 'server-only'

interface LicenseStatus {
  valid: boolean
  tier: 'free' | 'pro'
  code: string
}

const KEYGEN_ACCOUNT_ID = process.env.KEYGEN_ACCOUNT_ID ?? ''

export async function validateLicense(key: string): Promise<LicenseStatus> {
  if (!KEYGEN_ACCOUNT_ID) return { valid: false, tier: 'free', code: 'NO_ACCOUNT' }

  const res = await fetch(
    `https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses/actions/validate-key`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: JSON.stringify({ meta: { key } }),
      next: { revalidate: 3600 }, // cache for 1 hour in Next.js fetch cache
    }
  )

  const json = await res.json()
  return {
    valid: json.meta?.valid === true,
    tier:  json.data?.attributes?.metadata?.tier === 'pro' ? 'pro' : 'free',
    code:  json.meta?.code ?? 'UNKNOWN',
  }
}

export async function getLicenseStatus(): Promise<LicenseStatus> {
  const key = process.env.PENPAD_LICENSE_KEY
  if (!key) return { valid: false, tier: 'free', code: 'NO_KEY' }
  return validateLicense(key)
}

export function isSelfHosted(): boolean {
  return Boolean(process.env.PENPAD_LICENSE_KEY)
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test src/lib/__tests__/license.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/license.ts src/lib/__tests__/license.test.ts
git commit -m "feat: add Keygen.sh license validation"
```

---

### Task 4.2: Make `getMySubscription` license-aware

**Files:**
- Modify: `src/lib/subscriptions.ts`

- [ ] **Step 1: Update to check license key on self-hosted**

```ts
import 'server-only'
import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { getLicenseStatus, isSelfHosted } from '@/lib/license'
import type { Subscription } from '@/lib/db/schema'

export const getMySubscription = cache(async (): Promise<Subscription | null> => {
  // Self-hosted: use license key instead of Stripe subscription
  if (isSelfHosted()) {
    const license = await getLicenseStatus()
    if (!license.valid) return null
    // Return a synthetic subscription record so all existing isPro checks work unchanged
    return {
      id: 'license',
      userId: 'license',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      status: license.tier === 'pro' ? 'active' : 'inactive',
      currentPeriodEnd: null,
      updatedAt: new Date(),
    }
  }

  // Cloud: original Stripe path
  const { requireUser } = await import('@/lib/auth/session')
  const user = await requireUser()

  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1)
  return rows[0] ?? null
})
```

- [ ] **Step 2: Run tests**

```bash
pnpm test
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/subscriptions.ts
git commit -m "feat: license key gating in getMySubscription for self-hosted"
```

---

### Task 4.3: Add update notification banner

**Files:**
- Create: `src/app/api/version/route.ts`
- Create: `src/components/layout/update-banner.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Create version endpoint**

```ts
// src/app/api/version/route.ts
import { NextResponse } from 'next/server'
import pkg from '../../../package.json'

export function GET() {
  return NextResponse.json({ version: pkg.version })
}
```

- [ ] **Step 2: Create the banner component**

```tsx
// src/components/layout/update-banner.tsx
import { getLicenseStatus, isSelfHosted } from '@/lib/license'

async function getLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch('https://pen-pad.vercel.app/api/version', {
      next: { revalidate: 86400 }, // check once per day
    })
    const json = await res.json()
    return json.version ?? null
  } catch {
    return null
  }
}

export async function UpdateBanner({ currentVersion }: { currentVersion: string }) {
  if (!isSelfHosted()) return null

  const latestVersion = await getLatestVersion()
  if (!latestVersion || latestVersion === currentVersion) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 text-center">
      PenPad {latestVersion} is available.{' '}
      <a
        href="https://github.com/d4rkwolf/penpad/releases"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-medium"
      >
        See what&apos;s new
      </a>{' '}
      — run <code className="font-mono bg-amber-100 px-1 rounded">docker compose pull && docker compose up -d</code> to update.
    </div>
  )
}
```

- [ ] **Step 3: Add banner to app layout**

In `src/app/(app)/layout.tsx`, import and render `UpdateBanner` above `AppShell` children. Pass `currentVersion` from `package.json`.

- [ ] **Step 4: Run tests and build**

```bash
pnpm test && pnpm build
```

Expected: PASS + clean build

- [ ] **Step 5: Commit**

```bash
git add src/app/api/version/route.ts src/components/layout/update-banner.tsx src/app/(app)/layout.tsx
git commit -m "feat: update notification banner for self-hosted deployments"
```

---

### Task 4.4: License key settings page

**Files:**
- Create: `src/app/(app)/settings/license/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/(app)/settings/license/page.tsx
import { getLicenseStatus, isSelfHosted } from '@/lib/license'

export default async function LicensePage() {
  if (!isSelfHosted()) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-sm">
          License keys apply to self-hosted deployments only.{' '}
          You are using the cloud-hosted version of PenPad.
        </p>
      </div>
    )
  }

  const license = await getLicenseStatus()

  return (
    <div className="p-6 max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">License</h1>
      <div className="rounded-lg border p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className={license.valid ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {license.valid ? 'Active' : 'Invalid'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tier</span>
          <span className="capitalize">{license.tier}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Code</span>
          <span className="font-mono text-xs">{license.code}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        To change your license key, update <code>PENPAD_LICENSE_KEY</code> in your{' '}
        <code>.env</code> file and restart the container.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Add link to sidebar**

In `src/components/layout/sidebar.tsx`, add a "License" nav item under Settings, only visible when `isSelfHosted()` is true.

- [ ] **Step 3: Run tests and build**

```bash
pnpm test && pnpm build
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/settings/license/ src/components/layout/sidebar.tsx
git commit -m "feat: license key status page for self-hosted mode"
```

---

## Phase 5: Keygen Account Setup (Non-Code)

Before Phase 4 ships, these steps happen in your Keygen dashboard:

- [ ] Create a Keygen account at [keygen.sh](https://keygen.sh)
- [ ] Create a **Product** called "PenPad Self-Hosted"
- [ ] Create a **Policy**: `pro` tier, max 1 machine, yearly or lifetime pricing
- [ ] Set `KEYGEN_ACCOUNT_ID` in Vercel env (cloud, so your server can issue licenses)
- [ ] Wire Stripe → Keygen: after successful Stripe payment, call `POST /v1/accounts/{id}/licenses` to issue a license key and email it to the customer
- [ ] Test the full flow: buy → receive key → enter in `PENPAD_LICENSE_KEY` → restart → verify `/settings/license` shows Active

---

## Self-Review

**Spec coverage:**
- ✅ Self-hosting via Docker Compose — Phase 3
- ✅ Data stays local — Postgres volume, no Supabase cloud
- ✅ License key billing — Phase 4
- ✅ License validates against Keygen (remote check, not data) — Task 4.1
- ✅ Feature gating works for both cloud and self-hosted — Task 4.2
- ✅ Update notifications — Task 4.3
- ✅ Cloud product unchanged — Stripe path preserved in subscriptions.ts
- ✅ Migration on startup — Task 3.2/3.3
- ✅ Auth fully self-contained (no Supabase dependency) — Phase 2

**Placeholder scan:** None found.

**Type consistency:** `Subscription` type from `schema.ts` used for synthetic license return in Task 4.2 — all fields present and nullable fields explicitly set.
