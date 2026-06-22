# AI-Assisted Finding Writing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "✨ Draft with AI" action to the finding form that turns a vulnerability title + optional notes into professional Description / Impact / Recommendation drafts via Claude, Pro-gated and rate-limited on cloud.

**Architecture:** A server-only AI layer (`src/lib/ai/draft.ts`) calls the Anthropic SDK with a forced `emit_finding` tool to get reliably-structured `{description, impact, recommendation}`. A cloud-only daily rate limiter (`ai_usage` table + helper) caps free-key usage. A Pro-gated server action (`src/app/actions/ai.ts`) orchestrates gate → rate-limit → draft. The finding form gains an optional notes textarea and a button that fills the three narrative fields for the tester to edit. One key path: `ANTHROPIC_API_KEY` from env (PenPad's on cloud, the customer's on self-hosted); inert with a clear message when absent.

**Tech Stack:** Next.js 16.2.6 (non-standard — see AGENTS.md), React 19, TypeScript, `@anthropic-ai/sdk`, Drizzle ORM (postgres-js), Supabase Postgres (cloud) / self-hosted Postgres, Zod v4, Vitest.

## Global Constraints

- **Package manager is pnpm with a workspace root.** Install deps with `pnpm add -w <pkg>` (a bare `pnpm add` fails with `ERR_PNPM_ADDING_TO_ROOT`).
- **Spec source of truth:** `docs/superpowers/specs/2026-06-22-ai-finding-writing-design.md`.
- **Model default is `claude-sonnet-4-6`, overridable via `ANTHROPIC_MODEL`.** Best professional-prose-per-dollar for this client-facing wedge feature; operators set `ANTHROPIC_MODEL=claude-haiku-4-5` for cheapest cloud trial cost or `claude-opus-4-8` for max quality. (Per the `claude-api` skill the code default would be `claude-opus-4-8`; the spec explicitly named haiku/sonnet as the intended models, so sonnet is the chosen default — overridable.)
- **AI calls use Anthropic tool-use with forced `tool_choice`, non-streaming.** `max_tokens: 1200` is well under the streaming-timeout threshold. **Do NOT set `thinking`** — omit it (forced tool_choice does not need thinking; on Sonnet 4.6 an omitted `thinking` field means thinking is off). **Never use `budget_tokens`** (rejected/deprecated on current models).
- **RLS posture:** new tables get RLS enabled with **NO policies** (deny-by-default for the Data API). The app uses a direct Drizzle connection that bypasses RLS. `auth.uid()` is dead under better-auth — **DO NOT add `auth.uid()` policies.**
- **Cloud migration application is a CONTROLLER action, not a subagent step.** Subagents write the SQL file and regenerate the self-hosted Drizzle migration only. The controller applies the cloud migration live to Supabase (project ref `vtdmtnpsybqmcgtdvblu`) via the Supabase MCP `apply_migration` tool.
- **Stop before production merge.** Go-live depends on Connor's external setup (Vercel `ANTHROPIC_API_KEY`). The branch is built, verified, and left for review — do not merge to `main`.
- **Test mocking convention:** `vi.hoisted()` to declare mock fns, then `vi.mock()` (see `src/lib/__tests__/subscriptions.test.ts`). `server-only` is aliased to a stub in `vitest.config.ts`, so server-only modules import cleanly under test.
- **Next.js is non-standard (AGENTS.md):** before writing Next-specific code, consult `node_modules/next/dist/docs/`. The changes here are standard React + server actions, but heed the rule.

---

### Task 1: AI access layer — `src/lib/ai/draft.ts`

**Files:**
- Modify: `package.json` (add `@anthropic-ai/sdk` dependency)
- Create: `src/lib/ai/draft.ts`
- Test: `src/lib/ai/__tests__/draft.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks; `@anthropic-ai/sdk`, `zod`.
- Produces:
  - `isAiConfigured(): boolean`
  - `interface DraftInput { title: string; affectedComponent?: string | null; notes?: string | null }`
  - `type DraftOutput = { description: string; impact: string; recommendation: string }`
  - `draftFinding(input: DraftInput): Promise<DraftOutput>` — throws `Error('AI_NOT_CONFIGURED')` when no key, `Error('AI_BAD_OUTPUT')` when the model returns no/invalid tool input.

- [ ] **Step 1: Install the Anthropic SDK**

```bash
cd /home/turkish/Documents/D4rkWolf/studios/products/PenPad
pnpm add -w @anthropic-ai/sdk
```

Expected: `@anthropic-ai/sdk` appears in `package.json` dependencies; lockfile updates. (If it errors with `ERR_PNPM_ADDING_TO_ROOT`, confirm the `-w` flag is present.)

- [ ] **Step 2: Write the failing test**

Create `src/lib/ai/__tests__/draft.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate }
  },
}))

import { draftFinding, isAiConfigured } from '@/lib/ai/draft'

describe('isAiConfigured', () => {
  const original = process.env.ANTHROPIC_API_KEY
  afterEach(() => {
    if (original === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = original
  })

  it('is true when ANTHROPIC_API_KEY is set', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test'
    expect(isAiConfigured()).toBe(true)
  })

  it('is false when ANTHROPIC_API_KEY is absent', () => {
    delete process.env.ANTHROPIC_API_KEY
    expect(isAiConfigured()).toBe(false)
  })
})

describe('draftFinding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'sk-test'
  })

  it('returns the three sections from a tool_use response', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          name: 'emit_finding',
          input: {
            description: 'SQL injection in the login endpoint.',
            impact: 'An attacker can read or modify the database.',
            recommendation: 'Use parameterised queries.',
          },
        },
      ],
    })

    const result = await draftFinding({ title: 'SQL Injection', affectedComponent: '/login', notes: null })

    expect(result).toEqual({
      description: 'SQL injection in the login endpoint.',
      impact: 'An attacker can read or modify the database.',
      recommendation: 'Use parameterised queries.',
    })
    // model + forced tool choice are configured
    const call = mockCreate.mock.calls[0][0]
    expect(call.tool_choice).toEqual({ type: 'tool', name: 'emit_finding' })
    expect(call.thinking).toBeUndefined()
  })

  it('throws AI_NOT_CONFIGURED when no key is set', async () => {
    delete process.env.ANTHROPIC_API_KEY
    await expect(draftFinding({ title: 'X' })).rejects.toThrow('AI_NOT_CONFIGURED')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('throws AI_BAD_OUTPUT when the tool input is malformed', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'tool_use', name: 'emit_finding', input: { description: 'only one field' } }] })
    await expect(draftFinding({ title: 'X' })).rejects.toThrow('AI_BAD_OUTPUT')
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm exec vitest run src/lib/ai/__tests__/draft.test.ts`
Expected: FAIL — cannot resolve `@/lib/ai/draft` (module not found).

- [ ] **Step 4: Write the implementation**

Create `src/lib/ai/draft.ts`:

```ts
import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const DEFAULT_MODEL = 'claude-sonnet-4-6'

const SYSTEM_PROMPT =
  'You are a senior penetration tester writing a professional, client-ready security finding. ' +
  'Given the vulnerability title and optional context, write three sections — Description (what it is ' +
  'and where), Impact (business/technical consequence), Recommendation (concrete remediation steps). ' +
  'Be accurate and concise; do not invent specifics (versions, endpoints, data) that are not given. ' +
  'Plain professional prose, no markdown headers.'

const DraftOutputSchema = z.object({
  description: z.string(),
  impact: z.string(),
  recommendation: z.string(),
})

export type DraftOutput = z.infer<typeof DraftOutputSchema>

export interface DraftInput {
  title: string
  affectedComponent?: string | null
  notes?: string | null
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export async function draftFinding(input: DraftInput): Promise<DraftOutput> {
  if (!isAiConfigured()) throw new Error('AI_NOT_CONFIGURED')

  // Instantiate lazily so importing isAiConfigured() never constructs a client
  // (the SDK constructor reads ANTHROPIC_API_KEY from env).
  const client = new Anthropic()
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL

  const userParts = [`Vulnerability title: ${input.title}`]
  if (input.affectedComponent) userParts.push(`Affected component: ${input.affectedComponent}`)
  if (input.notes) userParts.push(`Additional context from the tester:\n${input.notes}`)

  // Typed array assignment gives the tool literal its contextual type, so
  // `type: 'object'` is accepted without `as const`.
  const tools: Anthropic.Tool[] = [
    {
      name: 'emit_finding',
      description: 'Return the three written sections of a security finding.',
      input_schema: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'What the vulnerability is and where it occurs.' },
          impact: { type: 'string', description: 'The business and technical consequence if exploited.' },
          recommendation: { type: 'string', description: 'Concrete, actionable remediation steps.' },
        },
        required: ['description', 'impact', 'recommendation'],
      },
    },
  ]

  const response = await client.messages.create({
    model,
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    tools,
    tool_choice: { type: 'tool', name: 'emit_finding' },
    messages: [{ role: 'user', content: userParts.join('\n\n') }],
  })

  const block = response.content.find(b => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') throw new Error('AI_BAD_OUTPUT')

  const parsed = DraftOutputSchema.safeParse(block.input)
  if (!parsed.success) throw new Error('AI_BAD_OUTPUT')
  return parsed.data
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec vitest run src/lib/ai/__tests__/draft.test.ts`
Expected: PASS (all 5 cases).

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/ai/draft.ts src/lib/ai/__tests__/draft.test.ts
git commit -m "feat(ai): add Claude-backed finding draft layer (lib/ai/draft.ts)"
```

---

### Task 2: Rate-limit table + helper (cloud only)

**Files:**
- Modify: `src/lib/db/schema.ts` (add `aiUsage` table + types)
- Create: `src/lib/ai/limits.ts` (`AI_DAILY_LIMIT`)
- Create: `src/lib/ai/usage.ts` (`checkAndIncrementAiUsage`)
- Create: `supabase/migrations/20260622000000_add_ai_usage.sql` (cloud lineage)
- Generate: `drizzle/0001_*.sql` (+ `drizzle/meta/` update) via drizzle-kit (self-hosted lineage)
- Test: `src/lib/ai/__tests__/usage.test.ts`

**Interfaces:**
- Consumes: `db` from `@/lib/db`; `aiUsage` table.
- Produces:
  - `AI_DAILY_LIMIT: number` (= 30)
  - `aiUsage` pgTable + `AiUsage` / `NewAiUsage` types
  - `checkAndIncrementAiUsage(userId: string, limit?: number): Promise<void>` — throws `Error('AI_RATE_LIMITED')` when the post-increment count exceeds `limit`.

- [ ] **Step 1: Add the `aiUsage` table to the schema**

In `src/lib/db/schema.ts`, add `primaryKey` to the `drizzle-orm/pg-core` import:

```ts
import { pgTable, uuid, text, numeric, integer, timestamp, date, primaryKey } from 'drizzle-orm/pg-core'
```

Then add the table after `stripeEventsProcessed` (before the type exports block):

```ts
export const aiUsage = pgTable('ai_usage', {
  userId:    text('user_id').notNull(),
  usageDate: date('usage_date').notNull(),
  count:     integer('count').notNull().default(0),
}, (t) => [primaryKey({ columns: [t.userId, t.usageDate] })])
```

And add to the type exports block:

```ts
export type AiUsage    = typeof aiUsage.$inferSelect
export type NewAiUsage = typeof aiUsage.$inferInsert
```

- [ ] **Step 2: Add the daily-limit constant**

Create `src/lib/ai/limits.ts`:

```ts
// Daily per-user cap on AI drafts when running on PenPad's key (cloud trial).
// Self-hosted deployments use the customer's own key and are not capped.
export const AI_DAILY_LIMIT = 30
```

- [ ] **Step 3: Write the failing test for the usage helper**

Create `src/lib/ai/__tests__/usage.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockReturning, mockOnConflict, mockValues, mockInsert } = vi.hoisted(() => {
  const mockReturning = vi.fn()
  const mockOnConflict = vi.fn().mockReturnValue({ returning: mockReturning })
  const mockValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflict })
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
  return { mockReturning, mockOnConflict, mockValues, mockInsert }
})

vi.mock('@/lib/db', () => ({ db: { insert: mockInsert } }))

import { checkAndIncrementAiUsage } from '@/lib/ai/usage'

describe('checkAndIncrementAiUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnConflict.mockReturnValue({ returning: mockReturning })
    mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflict })
    mockInsert.mockReturnValue({ values: mockValues })
  })

  it('passes when the post-increment count is at the limit', async () => {
    mockReturning.mockResolvedValue([{ count: 30 }])
    await expect(checkAndIncrementAiUsage('user-1', 30)).resolves.toBeUndefined()
    expect(mockInsert).toHaveBeenCalledTimes(1)
  })

  it('throws AI_RATE_LIMITED when the post-increment count exceeds the limit', async () => {
    mockReturning.mockResolvedValue([{ count: 31 }])
    await expect(checkAndIncrementAiUsage('user-1', 30)).rejects.toThrow('AI_RATE_LIMITED')
  })

  it('defaults to AI_DAILY_LIMIT (30)', async () => {
    mockReturning.mockResolvedValue([{ count: 31 }])
    await expect(checkAndIncrementAiUsage('user-1')).rejects.toThrow('AI_RATE_LIMITED')
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm exec vitest run src/lib/ai/__tests__/usage.test.ts`
Expected: FAIL — cannot resolve `@/lib/ai/usage`.

- [ ] **Step 5: Write the usage helper**

Create `src/lib/ai/usage.ts`:

```ts
import 'server-only'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { aiUsage } from '@/lib/db/schema'
import { AI_DAILY_LIMIT } from './limits'

/**
 * Atomically increment today's AI-draft count for a user and reject when it
 * exceeds `limit`. Cloud-only — self-hosted deployments use the customer's own
 * key and are not rate-limited. Throws Error('AI_RATE_LIMITED') when over cap.
 */
export async function checkAndIncrementAiUsage(
  userId: string,
  limit: number = AI_DAILY_LIMIT,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)

  const [row] = await db
    .insert(aiUsage)
    .values({ userId, usageDate: today, count: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.usageDate],
      set: { count: sql`${aiUsage.count} + 1` },
    })
    .returning({ count: aiUsage.count })

  if ((row?.count ?? 0) > limit) throw new Error('AI_RATE_LIMITED')
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm exec vitest run src/lib/ai/__tests__/usage.test.ts`
Expected: PASS (3 cases).

- [ ] **Step 7: Write the cloud migration SQL file**

Create `supabase/migrations/20260622000000_add_ai_usage.sql`:

```sql
-- AI draft usage counter (cloud trial rate limiting).
-- RLS enabled with NO policies = deny-by-default for the Data API; the app
-- reaches this table via the direct Drizzle connection, which bypasses RLS.
-- Do NOT add auth.uid() policies — auth.uid() is dead under better-auth.
create table if not exists ai_usage (
  user_id    text    not null,
  usage_date date    not null,
  count      integer not null default 0,
  primary key (user_id, usage_date)
);

alter table ai_usage enable row level security;
```

> **Controller note (NOT a subagent step):** the controller applies this to the live cloud DB via the Supabase MCP `apply_migration` tool (project ref `vtdmtnpsybqmcgtdvblu`, name `add_ai_usage`). Do not delegate the live `apply_migration` to a subagent.

- [ ] **Step 8: Regenerate the self-hosted Drizzle migration**

Run: `pnpm exec drizzle-kit generate --config drizzle.config.selfhosted.ts`
Expected: a new `drizzle/0001_*.sql` is created and `drizzle/meta/` updated. Open the generated SQL and confirm it contains `CREATE TABLE "ai_usage"` with the composite primary key.

> **Known-drift note:** `main`'s `drizzle/0000` baseline snapshot may predate the better-auth `user_id` uuid→text change, so the generated `0001` can carry incidental `ALTER ... TYPE text` statements alongside the `ai_usage` table. This is non-destructive on a fresh self-hosted Postgres (the only kind that exists today) and is the same pre-existing baseline drift flagged on the packaging/screenshots branches. Leave it; flag for merge-time baseline reconciliation. The required content is the `ai_usage` table — verify that is present.

- [ ] **Step 9: Run the full test suite**

Run: `pnpm test`
Expected: PASS — all existing tests plus the new draft + usage tests.

- [ ] **Step 10: Commit**

```bash
git add src/lib/db/schema.ts src/lib/ai/limits.ts src/lib/ai/usage.ts \
        src/lib/ai/__tests__/usage.test.ts \
        supabase/migrations/20260622000000_add_ai_usage.sql drizzle/
git commit -m "feat(ai): add ai_usage table + daily rate-limit helper (cloud)"
```

---

### Task 3: Server action — `src/app/actions/ai.ts`

**Files:**
- Modify: `src/lib/validations.ts` (add `AiDraftSchema`)
- Create: `src/app/actions/ai.ts`
- Test: `src/app/actions/__tests__/ai.test.ts`

**Interfaces:**
- Consumes: `requireUser` (`@/lib/auth/session`), `getMySubscription` (`@/lib/subscriptions`), `isSelfHosted` (`@/lib/license`), `isAiConfigured` + `draftFinding` (`@/lib/ai/draft`), `checkAndIncrementAiUsage` (`@/lib/ai/usage`), `AI_DAILY_LIMIT` (`@/lib/ai/limits`), `AiDraftSchema` (`@/lib/validations`).
- Produces: `draftFinding(input: { title: string; affectedComponent?: string | null; notes?: string | null }): Promise<DraftOutput>` — the Pro-gated, rate-limited server action the UI calls. Throws user-facing `Error` messages.

- [ ] **Step 1: Add the input schema**

In `src/lib/validations.ts`, append after the Findings section:

```ts
// ── AI drafting ─────────────────────────────────────────────────────────────

export const AiDraftSchema = z.object({
  title:             z.string().min(1, 'Title is required').max(500),
  affectedComponent: z.string().max(500).optional().nullable(),
  notes:             z.string().max(4_000).optional().nullable(),
})

export type AiDraftInput = z.infer<typeof AiDraftSchema>
```

- [ ] **Step 2: Write the failing test**

Create `src/app/actions/__tests__/ai.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockRequireUser, mockGetSub, mockIsSelfHosted,
  mockIsAiConfigured, mockDraftFinding, mockCheckAndIncrement,
} = vi.hoisted(() => ({
  mockRequireUser: vi.fn(),
  mockGetSub: vi.fn(),
  mockIsSelfHosted: vi.fn(),
  mockIsAiConfigured: vi.fn(),
  mockDraftFinding: vi.fn(),
  mockCheckAndIncrement: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({ requireUser: mockRequireUser }))
vi.mock('@/lib/subscriptions', () => ({ getMySubscription: mockGetSub }))
vi.mock('@/lib/license', () => ({ isSelfHosted: mockIsSelfHosted }))
vi.mock('@/lib/ai/draft', () => ({ isAiConfigured: mockIsAiConfigured, draftFinding: mockDraftFinding }))
vi.mock('@/lib/ai/usage', () => ({ checkAndIncrementAiUsage: mockCheckAndIncrement }))

import { draftFinding } from '@/app/actions/ai'

const DRAFT = { description: 'd', impact: 'i', recommendation: 'r' }

describe('draftFinding action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireUser.mockResolvedValue({ id: 'user-1' })
    mockGetSub.mockResolvedValue({ status: 'active' })
    mockIsSelfHosted.mockReturnValue(false)
    mockIsAiConfigured.mockReturnValue(true)
    mockDraftFinding.mockResolvedValue(DRAFT)
    mockCheckAndIncrement.mockResolvedValue(undefined)
  })

  it('returns the draft for an active cloud user (rate-limit checked)', async () => {
    const result = await draftFinding({ title: 'SQLi' })
    expect(result).toEqual(DRAFT)
    expect(mockCheckAndIncrement).toHaveBeenCalledWith('user-1')
    expect(mockDraftFinding).toHaveBeenCalledWith({ title: 'SQLi', affectedComponent: null, notes: null })
  })

  it('rejects a non-Pro user before drafting', async () => {
    mockGetSub.mockResolvedValue({ status: 'inactive' })
    await expect(draftFinding({ title: 'SQLi' })).rejects.toThrow(/Pro/)
    expect(mockDraftFinding).not.toHaveBeenCalled()
  })

  it('skips the rate limit on self-hosted', async () => {
    mockIsSelfHosted.mockReturnValue(true)
    await draftFinding({ title: 'SQLi' })
    expect(mockCheckAndIncrement).not.toHaveBeenCalled()
    expect(mockDraftFinding).toHaveBeenCalled()
  })

  it('maps AI_RATE_LIMITED to a friendly message', async () => {
    mockCheckAndIncrement.mockRejectedValue(new Error('AI_RATE_LIMITED'))
    await expect(draftFinding({ title: 'SQLi' })).rejects.toThrow(/today's AI limit/)
    expect(mockDraftFinding).not.toHaveBeenCalled()
  })

  it('throws when AI is not configured', async () => {
    mockIsAiConfigured.mockReturnValue(false)
    await expect(draftFinding({ title: 'SQLi' })).rejects.toThrow(/not configured/)
  })

  it('rejects an empty title (validation)', async () => {
    await expect(draftFinding({ title: '' })).rejects.toThrow(/Title is required/)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm exec vitest run src/app/actions/__tests__/ai.test.ts`
Expected: FAIL — cannot resolve `@/app/actions/ai`.

- [ ] **Step 4: Write the server action**

Create `src/app/actions/ai.ts`:

```ts
'use server'

import { requireUser } from '@/lib/auth/session'
import { getMySubscription } from '@/lib/subscriptions'
import { isSelfHosted } from '@/lib/license'
import { isAiConfigured, draftFinding as draftFindingAI } from '@/lib/ai/draft'
import type { DraftOutput } from '@/lib/ai/draft'
import { checkAndIncrementAiUsage } from '@/lib/ai/usage'
import { AI_DAILY_LIMIT } from '@/lib/ai/limits'
import { AiDraftSchema } from '@/lib/validations'

export async function draftFinding(input: {
  title: string
  affectedComponent?: string | null
  notes?: string | null
}): Promise<DraftOutput> {
  const user = await requireUser()

  const sub = await getMySubscription()
  if (sub?.status !== 'active') throw new Error('AI drafting is a Pro feature.')

  // Validate before spending an API call.
  const parsed = AiDraftSchema.safeParse(input)
  if (!parsed.success) throw new Error(parsed.error.issues.map(i => i.message).join('; '))
  const d = parsed.data

  // Cloud trial: rate-limit on PenPad's key. Self-hosted uses the customer's key.
  if (!isSelfHosted()) {
    try {
      await checkAndIncrementAiUsage(user.id)
    } catch (err) {
      if (err instanceof Error && err.message === 'AI_RATE_LIMITED') {
        throw new Error(`You've hit today's AI limit (${AI_DAILY_LIMIT}). Try again tomorrow.`)
      }
      throw err
    }
  }

  if (!isAiConfigured()) throw new Error('AI drafting is not configured.')

  try {
    return await draftFindingAI({
      title: d.title,
      affectedComponent: d.affectedComponent ?? null,
      notes: d.notes ?? null,
    })
  } catch {
    throw new Error('AI drafting failed — please try again.')
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm exec vitest run src/app/actions/__tests__/ai.test.ts`
Expected: PASS (6 cases).

- [ ] **Step 6: Commit**

```bash
git add src/lib/validations.ts src/app/actions/ai.ts src/app/actions/__tests__/ai.test.ts
git commit -m "feat(ai): add Pro-gated, rate-limited draftFinding server action"
```

---

### Task 4: UI — "Draft with AI" in the finding form

**Files:**
- Modify: `src/components/findings/finding-form.tsx` (notes textarea, button, fill logic, `aiEnabled` prop)
- Modify: `src/app/(app)/reports/[id]/page.tsx` (compute + pass `aiEnabled`)
- Modify: `.env.local.example` (document `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL`)

**Interfaces:**
- Consumes: `draftFinding` from `@/app/actions/ai`; `isAiConfigured` from `@/lib/ai/draft` (in the server page).
- Produces: `FindingForm` gains a required `aiEnabled: boolean` prop.

> No unit test: this is a client component and the repo has no component-test harness (vitest runs in `node`; coverage `include` is `src/lib/**`). Verification is `tsc` + `build` in Task 5. Keep the logic thin and delegated to the already-tested action.

- [ ] **Step 1: Wire `aiEnabled` in the report page**

In `src/app/(app)/reports/[id]/page.tsx`, add the import near the other `@/lib` imports (after line 11's `getMySubscription` import):

```ts
import { isAiConfigured } from '@/lib/ai/draft'
```

After `const isPro = sub?.status === 'active'` (line 41), add:

```ts
  const aiEnabled = isAiConfigured() && isPro
```

Change the `FindingForm` render (line 104) to pass the prop:

```tsx
            <FindingForm reportId={id} myTemplates={myTemplates} isPro={isPro} aiEnabled={aiEnabled} />
```

- [ ] **Step 2: Add the AI controls to the finding form**

In `src/components/findings/finding-form.tsx`:

(a) Update the imports — add `useTransition` and the action:

```tsx
import { useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { createFinding } from '@/app/actions/findings'
import { draftFinding } from '@/app/actions/ai'
```

(b) Add `aiEnabled` to the component props and signature:

```tsx
export function FindingForm({
  reportId,
  myTemplates,
  isPro,
  aiEnabled,
}: {
  reportId: string
  myTemplates: FindingTemplate[]
  isPro: boolean
  aiEnabled: boolean
}) {
```

(c) Inside the component, after the existing `useState` lines (`fields`, `error`), add AI state:

```tsx
  const [aiNotes, setAiNotes]   = useState('')
  const [aiError, setAiError]   = useState<string | null>(null)
  const [isDrafting, startDraft] = useTransition()

  function fillField(key: 'description' | 'impact' | 'recommendation', value: string) {
    setFields(f => {
      const current = f[key]
      if (current.trim() && !confirm(`Replace the existing ${key}?`)) return f
      return { ...f, [key]: value }
    })
  }

  function handleDraft() {
    setAiError(null)
    if (!fields.title.trim()) {
      setAiError('Enter a title first, then draft with AI.')
      return
    }
    startDraft(async () => {
      try {
        const draft = await draftFinding({
          title: fields.title,
          affectedComponent: fields.affectedComponent ?? null,
          notes: aiNotes || null,
        })
        fillField('description', draft.description)
        fillField('impact', draft.impact)
        fillField('recommendation', draft.recommendation)
      } catch (err) {
        setAiError(err instanceof Error ? err.message : 'AI drafting failed — please try again.')
      }
    })
  }
```

(d) Render the AI block. Inside the `<form>`, immediately after the "Affected component" `Field` (closing tag at line ~134) and before the CVSS/Description grid, insert:

```tsx
        {aiEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg-subtle, transparent)' }}>
            <Field label="Context for AI" optional>
              <textarea
                className="textarea"
                rows={2}
                value={aiNotes}
                onChange={e => setAiNotes(e.target.value)}
                placeholder="Optional notes to steer the draft (e.g. observed behaviour, affected data)…"
              />
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleDraft}
                disabled={isDrafting}
              >
                {isDrafting ? 'Drafting…' : '✨ Draft with AI'}
              </button>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>
                AI draft — review before sending.
              </span>
            </div>
            {aiError && (
              <p role="alert" style={{ fontSize: 'var(--fs-sm)', color: 'var(--sev-critical)', margin: 0 }}>
                {aiError}
              </p>
            )}
          </div>
        )}
```

> Use a plain `type="button"` so the button never submits the form. The fields it fills are the existing controlled `description` / `impact` / `recommendation` textareas, so the normal `createFinding` submit flow is unchanged. `confirm()` is acceptable here — it matches the form's simple, dependency-free UX and the spec's "fill-if-empty else confirm-replace" rule.

- [ ] **Step 3: Document the env vars**

In `.env.local.example`, add (near other secrets):

```bash
# AI-assisted finding drafting (Pro feature). Inert until set.
# Cloud: PenPad's key on Vercel. Self-hosted: the customer's own key.
ANTHROPIC_API_KEY=
# Optional model override. Default: claude-sonnet-4-6.
# Cheapest for cloud trials: claude-haiku-4-5. Highest quality: claude-opus-4-8.
ANTHROPIC_MODEL=
```

- [ ] **Step 4: Type-check and build**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

Run: `pnpm build`
Expected: build succeeds (this is the authoritative type-check for the non-standard Next.js).

- [ ] **Step 5: Commit**

```bash
git add src/components/findings/finding-form.tsx "src/app/(app)/reports/[id]/page.tsx" .env.local.example
git commit -m "feat(ai): add Draft with AI button + notes input to finding form"
```

---

### Task 5: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `pnpm test`
Expected: PASS — all existing tests plus the new `draft`, `usage`, and `ai` action tests.

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Production build**

Run: `pnpm build`
Expected: success.

- [ ] **Step 4: Spec success-criteria walkthrough (manual review against the spec)**

Confirm against `docs/superpowers/specs/2026-06-22-ai-finding-writing-design.md` §7:
  1. A Pro user with a title (+ optional notes) clicks "✨ Draft with AI" → the three narrative fields fill; the tester edits and saves through the unchanged `createFinding` flow.
  2. Cloud (PenPad key, rate-limited) and self-hosted (customer key, no cap) both work; inert with a clear message when no key.
  3. Non-Pro users get no AI; the action is server-gated (`sub?.status !== 'active'` throws before drafting), not merely UI-hidden.
  4. An API failure or rate limit never corrupts the form (fields set only on success) and surfaces a clear message.
  5. Build / test / types clean.

- [ ] **Step 5: Stop — do not merge**

Leave the branch `feat/ai-finding-writing` built and verified for Connor's review. Go-live requires Connor to set `ANTHROPIC_API_KEY` in Vercel (and optionally `ANTHROPIC_MODEL`). The controller has applied the cloud `ai_usage` migration to Supabase; the self-hosted Drizzle migration is committed for the self-hosted lineage.

---

## Controller checklist (outside the subagent loop)

- [ ] Apply the cloud migration live: Supabase MCP `apply_migration` (project ref `vtdmtnpsybqmcgtdvblu`, name `add_ai_usage`, the SQL from Task 2 Step 7). Do this around Task 2, before runtime verification of the cloud rate-limit path.
- [ ] After all tasks: report status, leave the branch unmerged, and surface Connor's go-live items (Vercel `ANTHROPIC_API_KEY`, optional `ANTHROPIC_MODEL`).
