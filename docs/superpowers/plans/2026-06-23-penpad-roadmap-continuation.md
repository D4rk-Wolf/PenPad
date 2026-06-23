# PenPad — Roadmap Continuation Plan

> **Purpose:** a pick-up-later map for the remaining competitive-parity features. This is a *roadmap*, not a single implementation plan — each feature below gets its own brainstorm → spec → plan → build cycle when started. Read this first, then start the next feature with the `superpowers:brainstorming` skill.

**Last updated:** 2026-06-23 (after merging features #0, #1, #2 into `main`).

---

## Where things stand

**Direction (Connor, locked):** paid = self-hosted only. Cloud (penpad.co.uk) = 30-day full-Pro trial → free. Buy £49/mo → Keygen license → self-host via Docker. Pricing: Free £0 / Pro £49/mo. Explicitly NOT building: client portal, multi-user, Jira/ServiceNow sync.

**Merged into `main` (this session):**
- **#0 Self-hosted packaging** — Stripe→Keygen, 30-day cloud trial (`auth_user.trial_ends_at`), trial-based cloud entitlement (no Stripe row grants cloud Pro), Keygen provisioning from the Stripe webhook, license page, trial banner, GHCR Docker publish workflow. Inert until env set.
- **#1 Screenshot/image evidence** — `finding_images` bytea table, upload/serve routes, paste/drag/reorder UI on the finding card, PDF embedding.
- **#2 AI-assisted finding writing** (the wedge) — `src/lib/ai/draft.ts` (Anthropic tool-use), `ai_usage` rate-limit table (cloud-only, cap 30), Pro-gated `draftFinding` server action, "✨ Draft with AI" UI. Inert without `ANTHROPIC_API_KEY`.
- The stale `feat/self-hosted` branch was recorded as merged (its substance was already in main; the merge brought zero content change — proven by an empty diff vs main).

**Verified at merge:** 101/101 tests across 12 files; `pnpm build` clean; self-hosted drizzle lineage reconciled to a single clean baseline (`drizzle/0000_natural_excalibur.sql`, no uuid→text drift).

**Cloud DB (Supabase `vtdmtnpsybqmcgtdvblu`):** all three features' schema changes are already applied live (`ai_usage`, `finding_images`, `trial_ends_at`, keygen columns). The cloud migration lineage is `supabase/migrations/` (timestamped, applied via the Supabase MCP `apply_migration` by the controller). The self-hosted lineage is `drizzle/` (regenerated via `pnpm exec drizzle-kit generate --config drizzle.config.selfhosted.ts`).

---

## Go-live items (Connor's — outside the code)

These gate *activating* the merged features, not merging them:
- **#2 AI:** set `ANTHROPIC_API_KEY` (and optional `ANTHROPIC_MODEL`; default `claude-sonnet-4-6`, cheapest `claude-haiku-4-5`, max `claude-opus-4-8`) in Vercel.
- **#0 packaging:** create Keygen account + "Pro" policy → set `KEYGEN_ACCOUNT_ID` / `KEYGEN_API_TOKEN` / `KEYGEN_POLICY_ID` in Vercel; `RESEND_API_KEY` + verify sender for license-delivery email; push a `v*` tag to publish the GHCR image + make the package public; write the `/docs/self-hosting` page (referenced by the license page/email); test a purchase end-to-end.
- **Behavior change to flag:** packaging makes cloud Pro **trial-based** — existing Stripe subscriptions no longer grant cloud Pro on their own (the model is now trial → self-host). 5 prod users were backfilled with `trial_ends_at`.

**Pre-existing security item (not from these features):** RLS is disabled on `auth_account` (password hashes + OAuth tokens), `auth_session`, `auth_user`, `auth_verification`, `stripe_events_processed`. This is the better-auth/direct-Drizzle posture, but verify the Supabase anon key cannot reach `auth_account`.

**Also:** PenPad had 8 Dependabot alerts (3 high) — review.

---

## Remaining roadmap (ordered)

Each is independent and gets its own spec→plan→build. Recommended order is by revenue leverage + effort.

### #3 — Scanner imports (Burp / Nessus / Nmap)
**Why:** removes the biggest manual-entry chore; turns "type every finding" into "import + edit." High pull for the ICP.
**Scope sketch:** parse the three export formats (Burp XML, Nessus `.nessus` XML, Nmap XML) → map to the `findings` shape (title, description, severity/CVSS, affected component, evidence) → preview + select which to import → bulk-insert into a report. Server-side parsing (don't trust uploaded XML — guard against XXE/entity expansion). Pro-gated like other power features.
**Notes:** start with ONE format end-to-end (Burp or Nessus — whichever Connor's ICP uses most), then add the others. Each parser is a pure, unit-testable function. Consider a shared `ImportedFinding` intermediate type.

### #4 — CVSS 4.0 support
**Why:** PenPad is 3.1-only; competitors offer 4.0. Credibility/parity.
**Scope sketch:** add a CVSS 4.0 vector builder + score calculator (the `findings.cvssScore` numeric stays; add an optional vector string + version marker). Severity derivation already exists (`deriveSeverity`) — extend for 4.0 bands. UI: a vector picker. Keep 3.1 working (don't break existing findings).
**Notes:** the 4.0 scoring algorithm is well-specified (FIRST.org spec) — implement as a pure function with table-driven tests against published vectors.

### #5 — DOCX / HTML export
**Why:** PDF-only today; many clients want editable DOCX.
**Scope sketch:** mirror the existing PDF export route. DOCX via `docx` npm lib (server-side, Node runtime like the PDF route); HTML as a styled standalone file. Reuse the report+findings+branding query already in `export/route.tsx`. Pro-gated.
**Notes:** the PDF route (`src/app/(app)/reports/[id]/export/route.tsx`) is the template — same data fetch, same timeout/guard pattern, different renderer. Include screenshot images (the `imagesByFinding` map) in DOCX/HTML too.

### #6 — Report customization (section toggles / templates)
**Why:** lets testers tailor reports per client (exec summary on/off, branding, section order).
**Scope sketch:** a per-report or per-user config of which sections render + ordering; feed into the PDF/DOCX/HTML renderers. Builds naturally on #5.
**Notes:** keep it data-driven (a config object), not a fork per format.

### #7 — Light retest / remediation tracking (NO portal)
**Why:** lets testers mark findings remediated/retested across engagements — the lightweight end of what portal products do, without building a portal.
**Scope sketch:** a `status` + `retestedAt` + notes on findings (or a small `finding_retests` table); filter/badge in the UI; show in exports. Single-user only (the tester), no client-facing surface.

---

## How to build each one (the established pipeline)

1. `superpowers:brainstorming` → design doc in `docs/superpowers/specs/YYYY-MM-DD-<feature>-design.md`. Get Connor's approval on the design, then the written spec.
2. `superpowers:writing-plans` → bite-sized TDD plan in `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`.
3. `superpowers:subagent-driven-development` → fresh implementer subagent per task + per-task spec/quality review + a final whole-branch review (opus). Build on a `feat/<feature>` branch off `main`.
4. **Controller owns live cloud migrations** (Supabase MCP `apply_migration`, project `vtdmtnpsybqmcgtdvblu`) — subagents do code only.
5. Stop before prod merge unless Connor says merge; he holds the production deploy.

### Gotchas worth carrying forward
- **pnpm workspace root:** add deps with `pnpm add -w <pkg>` (bare `pnpm add` errors). After merging branches that added deps, run `pnpm install` before `pnpm build`.
- **Non-standard Next.js 16:** consult `node_modules/next/dist/docs/` before Next-API-specific code (see `AGENTS.md`). `pnpm build` is the authoritative type-check (a standalone `tsc --noEmit` flags pre-existing `.next/types/validator.ts` noise).
- **RLS posture:** new tables get RLS enabled, NO policies (deny-by-default; the app uses the direct Drizzle connection that bypasses RLS). Do NOT add `auth.uid()` policies — `auth.uid()` is dead under better-auth.
- **Dual migration lineage:** cloud = `supabase/migrations/` (apply live via MCP); self-hosted = `drizzle/` (regenerate via the selfhosted config). The drift problem is now resolved — the self-hosted baseline is a single clean `0000`. Keep it clean: regenerate, don't hand-edit.
- **Claude integration:** consult the `claude-api` skill for current model ids / SDK usage; don't guess.
- **Model id (Anthropic):** Opus 4.8 `claude-opus-4-8`, Sonnet 4.6 `claude-sonnet-4-6`, Haiku 4.5 `claude-haiku-4-5`.

### Pointers
- Specs: `docs/superpowers/specs/2026-06-16-*` (packaging), `2026-06-19-*` (screenshots, if present), `2026-06-22-ai-finding-writing-design.md`.
- Plans: `docs/superpowers/plans/2026-06-16-*`, `2026-06-22-ai-finding-writing.md`.
- Company memory: `project_penpad_self_hosted.md` in the D4rkWolf memory dir.
