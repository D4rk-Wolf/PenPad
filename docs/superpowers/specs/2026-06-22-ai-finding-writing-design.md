# PenPad — AI-Assisted Finding Writing — Design

**Date:** 2026-06-22
**Author:** Connor Simmons (with Claude)
**Status:** Design — approved shape, pending written-spec review
**Roadmap:** Feature #2 (the wedge). Branches off `main`, independent of #0 (packaging) and #1 (screenshots).

---

## 1. Problem & Goal

The ICP's #1 pain is *writing the report* ("4 hours per engagement"). PenPad should let a tester type a vulnerability title + a few notes and get professional, client-ready **description / impact / recommendation** drafts in seconds, which they then edit. No competitor at PenPad's price does this well — it's the differentiator that makes Pro worth paying for.

**Goal:** A "Draft with AI" action in the finding form fills the three narrative fields from the title + an optional notes hint, using Claude. Cloud trial users get it on PenPad's key (rate-limited); self-hosted users bring their own key.

---

## 2. Scope

### In scope
- Server-side Claude call producing `{ description, impact, recommendation }` from `{ title, affectedComponent?, notes? }`.
- One key path: `ANTHROPIC_API_KEY` from env (PenPad's on cloud, customer's on self-hosted); inert when absent.
- Pro-gating (via `getMySubscription().status === 'active'`).
- Cloud-only per-user daily rate limit.
- "Draft with AI" button + optional notes input in the finding form; fills the 3 fields for editing.

### Out of scope (YAGNI)
- Streaming responses (v1 waits for the full draft).
- AI-suggested CVSS/severity (tester's judgment; the form already has a CVSS input).
- Per-field "improve this" actions, multi-provider abstraction (Claude only), AI on screenshots/evidence.
- Self-hosted rate limiting (it's the customer's own key/cost).

---

## 3. Architecture / Data Flow

```
Finding form ──"Draft with AI" (title + optional notes)──> server action draftFinding()
  ├─ requireUser(); Pro gate (getMySubscription().status === 'active')
  ├─ if !isSelfHosted(): check + increment daily ai_usage (reject over cap)
  └─ lib/ai/draft.ts → Anthropic SDK (ANTHROPIC_API_KEY from env, latest Claude)
        → returns { description, impact, recommendation }
  ──> form fills the 3 fields (user edits) ──> existing createFinding flow unchanged
```

One code path for the key: on cloud, Vercel holds PenPad's `ANTHROPIC_API_KEY`; on self-hosted, the customer sets theirs in their Docker env. Absent key → AI inert (clear message), never throws.

---

## 4. Units

### 4.1 AI access layer — `src/lib/ai/draft.ts` (server-only)
- Dependency: `@anthropic-ai/sdk` (`pnpm add -w @anthropic-ai/sdk`).
- Model: latest Claude, env-overridable via `ANTHROPIC_MODEL` (default a fast capable model — resolve the exact current id via the `claude-api` skill at build; e.g. `claude-haiku-4-5` for cost/speed on the cloud trial, or `claude-sonnet-4-6` for richer prose — pick one default, make it overridable).
- `isAiConfigured(): boolean` → `Boolean(process.env.ANTHROPIC_API_KEY)`.
- `draftFinding(input: { title: string; affectedComponent?: string | null; notes?: string | null }): Promise<{ description: string; impact: string; recommendation: string }>`:
  - System prompt: "You are a senior penetration tester writing a professional, client-ready security finding. Given the vulnerability title and optional context, write three sections — Description (what it is and where), Impact (business/technical consequence), Recommendation (concrete remediation steps). Be accurate and concise; do not invent specifics (versions, endpoints, data) that aren't given. Plain professional prose, no markdown headers."
  - Use Anthropic **tool-use / structured output** (a single tool `emit_finding` with object schema {description, impact, recommendation}) so the result is reliably structured; fall back to JSON-parse if needed. `max_tokens` ~1200.
  - Throws typed errors the caller maps: `AI_NOT_CONFIGURED` (no key) — though the gate should prevent reaching here.

### 4.2 Rate limiting — `ai_usage` table + helper (cloud only)
- Table `ai_usage`: `userId text`, `usageDate date`, `count integer not null default 0`, primary key `(userId, usageDate)`. Dual migration (Supabase SQL + self-hosted drizzle regen).
- `checkAndIncrementAiUsage(userId, limit = AI_DAILY_LIMIT)`: upsert-increment today's row; throw `AI_RATE_LIMITED` if it would exceed. `AI_DAILY_LIMIT = 30` in `src/lib/ai/limits.ts`.
- Only called when `!isSelfHosted()`.

### 4.3 Server action — `src/app/actions/ai.ts`
- `'use server'`. `draftFinding(input)`:
  - `requireUser()`.
  - Pro gate: `const sub = await getMySubscription(); if (sub?.status !== 'active') throw new Error('Pro required')`.
  - If `!isSelfHosted()` → `await checkAndIncrementAiUsage(user.id)`.
  - If `!isAiConfigured()` → throw `'AI drafting is not configured'`.
  - Validate input with Zod (title required ≤500; notes ≤4000; affectedComponent ≤500).
  - Return `await draftFinding(input)`.

### 4.4 UI — finding form
- In `src/components/findings/finding-form.tsx`: add a small "Context for AI (optional)" textarea (`aiNotes`, not submitted to createFinding) and a "✨ Draft with AI" button near the description fields.
- A client component `AiDraftButton` (or inline): `useTransition`; on click — require a non-empty title (toast if empty), call `draftFinding({ title, affectedComponent, notes })`, on success set `description/impact/recommendation` in the form `fields` state (overwriting blanks; if a field already has content, confirm-or-append — simplest v1: fill only if empty, else ask "replace?" via a confirm). Loading + error states; toast on error (not configured / rate limited / failure).
- Show the button only when AI is available + user is Pro: pass an `aiEnabled` boolean prop from the server (report page computes `isAiConfigured() && isPro`); when false, hide the button (or show an upgrade hint for non-Pro). A short "AI draft — review before sending" caption near the button.

### 4.5 Gating / tiers
- AI = Pro (trial or self-hosted license), same gate as PDF export. Free post-trial cloud → button hidden/upgrade-nudge.

---

## 5. Error handling
- No key → action throws a clear message; UI toasts "AI drafting isn't configured." (Self-hosted users see this until they set their key.)
- Rate limited (cloud) → "You've hit today's AI limit (30). Try again tomorrow."
- Anthropic API error/timeout → caught, logged, UI toasts "AI drafting failed — try again." Never corrupts the form (fields only set on success).
- Malformed model output → tool-use schema makes this unlikely; if parse fails, treat as an API error.

## 6. Testing
- Unit (mocked Anthropic SDK + db): `draftFinding` returns the three fields from a mocked tool-use response; `isAiConfigured` reflects env.
- Rate limit: `checkAndIncrementAiUsage` increments and throws on the (N+1)th call (mocked db).
- Action: Pro-gate rejects non-active; rate-limit invoked only when `!isSelfHosted()`; unconfigured throws.
- `pnpm test` / `pnpm tsc` / `pnpm build` clean.

## 7. Success criteria
1. A Pro user types a title (+ optional notes) → "Draft with AI" fills description/impact/recommendation with professional prose in one click; the tester edits and saves via the existing flow.
2. Works on cloud (PenPad key, rate-limited) and self-hosted (customer key, no PenPad cap); inert with a clear message when no key.
3. Non-Pro users don't get AI; the action is server-gated (not just UI-hidden).
4. An API failure/limit never corrupts the form or crashes; clear user feedback.
5. Build/test/types clean.

## 8. Deliberately deferred
- Streaming, per-field improve, AI CVSS/severity, multi-provider, summarizing screenshots.

## 9. Config / secrets
- `ANTHROPIC_API_KEY` (Vercel for cloud; customer env for self-hosted). Optional `ANTHROPIC_MODEL`. Document in `.env.local.example`. Inert until set.
