# PenPad — Self-Hosted Packaging (Sub-project 0) — Design

**Date:** 2026-06-16
**Author:** Connor Simmons (with Claude)
**Status:** Design — approved shape, pending written-spec review
**Roadmap context:** Sub-project 0 of the competitive-parity roadmap. This spec covers **only** the packaging/billing change. Features (screenshots, AI writing, scanner imports, CVSS 4.0, DOCX/HTML export, report customization, retest tracking) are separate sub-projects with their own specs.

---

## 1. Problem & Goal

PenPad must become **"paid = self-hosted only."** Today, paid Pro exists two ways in parallel: a cloud Stripe subscription (`subscriptions.status='active'`) and a self-hosted Keygen license (`PENPAD_LICENSE_KEY`). We are collapsing this so that:

- **The cloud (penpad.co.uk) is a 30-day full-Pro trial, then free.** Real client data only ever lives on the customer's own infrastructure.
- **Paying provisions a self-hosted Keygen license**, not cloud Pro. The customer runs PenPad themselves (Docker), and their clients' vulnerability data never touches PenPad's servers.

**Goal:** A new cloud signup gets 30 days of full Pro to evaluate; converting means buying £49/mo → receiving a Keygen license → self-hosting. Cancelling suspends the license so the self-hosted instance drops to free.

---

## 2. Scope

### In scope
- Cloud **30-day trial** entitlement (replaces cloud Stripe-Pro).
- **Stripe → Keygen license provisioning** on purchase, with email + in-app delivery.
- **Subscription lifecycle → license lifecycle** sync (suspend/reinstate).
- Reworked `/settings/license` (cloud buyers see their key + Docker quickstart) and a **trial-countdown banner**.
- Reframed upgrade modal/CTA: "Get PenPad Pro — £49/mo, self-hosted."

### Out of scope (deliberately)
- Migrating a trial user's cloud reports into their self-hosted instance (trials are for evaluation; real work starts fresh self-hosted). An export/import path may come later.
- The feature sub-projects (1–7 on the roadmap).
- AI bring-your-own-key (feature #2's concern).
- Replacing Keygen with another licensing system.

---

## 3. Architecture

**Stripe is the billing source of truth; Keygen mirrors it; cloud entitlement is trial-based.**

```
Cloud signup ─▶ trial_ends_at = now + 30d ─▶ cloud Pro while now < trial_ends_at, else free

Buy (£49/mo) ─▶ Stripe Checkout ─▶ webhook checkout.session.completed
                                     ├─ Keygen: create license (policy=Pro, metadata.tier=pro)
                                     ├─ store keygen_license_id + license_key on subscriptions row
                                     └─ Resend: email key + Docker quickstart
Stripe sub canceled/past_due ─▶ webhook ─▶ Keygen: suspend license  (self-host drops to free)
Stripe sub back to active     ─▶ webhook ─▶ Keygen: reinstate license

Self-hosted instance ─▶ validates PENPAD_LICENSE_KEY against Keygen (unchanged, from PR #18)
```

Key point: a Stripe subscription **never** sets cloud Pro. Cloud Pro = trial window only. Buying = a self-hosted license.

---

## 4. Units

### 4.1 Trial system (cloud)
- Add `trial_ends_at timestamptz` to `public.auth_user` (nullable).
- Set on signup: `now() + interval '30 days'`. Wire into the better-auth signup path (server-side, where the user row is created) — if better-auth hooks aren't convenient, set it lazily on first authenticated request when null (`COALESCE` to created_at + 30d).
- **Backfill**: a migration sets `trial_ends_at = greatest(created_at + interval '30 days', now() + interval '30 days')` for existing users with NULL, so the current 5 users get a fresh 30-day window rather than locking instantly.

### 4.2 Entitlement logic (`src/lib/subscriptions.ts`)
- **Self-hosted** branch (`isSelfHosted()`): unchanged — Keygen license status.
- **Cloud** branch: return `status: 'active'` when `now < trial_ends_at`, else `'inactive'`. The Stripe `subscriptions` row no longer determines cloud Pro.
- Existing call sites use `sub?.status === 'active'` / `isPro` — keep that contract so they don't all change. Add `trialEndsAt` to the returned shape for the banner.
- Add `getCloudLicense()` (cloud only): returns the purchased Keygen license key + status for display, independent of trial state.

### 4.3 Keygen provisioning (`src/lib/keygen.ts`, server-only) — NEW
- `createProLicense({ email, stripeCustomerId, userId })`: `POST https://api.keygen.sh/v1/accounts/{KEYGEN_ACCOUNT_ID}/licenses` with `Authorization: Bearer {KEYGEN_API_TOKEN}`, policy = `KEYGEN_POLICY_ID`, `metadata: { tier: 'pro', userId, stripeCustomerId }`. Returns `{ licenseId, licenseKey }`.
- `suspendLicense(licenseId)` → `POST /licenses/{id}/actions/suspend`.
- `reinstateLicense(licenseId)` → `POST /licenses/{id}/actions/reinstate`.
- All inert/clear-error if `KEYGEN_API_TOKEN`/`KEYGEN_POLICY_ID` unset (like the existing validate path with `KEYGEN_ACCOUNT_ID`).

### 4.4 Webhook changes (`src/app/api/stripe/webhook/route.ts`)
- `checkout.session.completed` (subscription mode): after the existing user lookup, **create the Keygen license**, persist `keygen_license_id` + `license_key` on the user's `subscriptions` row, and **email** the key + Docker quickstart via Resend. (Keep the row for billing linkage; it just no longer grants cloud Pro.)
- `customer.subscription.deleted` / `invoice.payment_failed` (→ past_due): **suspend** the stored Keygen license.
- `customer.subscription.updated` → status active: **reinstate** the license.
- All Keygen calls wrapped so a Keygen failure logs + alerts but does not 500 the webhook (idempotency dedup already exists).

### 4.5 Delivery UX (`src/app/(app)/settings/license/page.tsx`)
- **Self-hosted view**: unchanged (shows live license validation).
- **Cloud view, has purchased license**: show the license key (with copy button), subscription status, and a **Docker quickstart** (compose snippet with `PENPAD_LICENSE_KEY=<key>`) + link to setup docs.
- **Cloud view, no purchase**: show trial status (days left or expired) + "Get PenPad Pro (self-hosted)" CTA → checkout.
- Resend email on provision mirrors the quickstart so the key is in their inbox.

### 4.6 Trial banner + reframed upgrade path
- **Trial banner** (authenticated app shell, cloud only): "X days of Pro left — keep PenPad by self-hosting → [Get Pro]". Hidden when self-hosted or trial not started.
- **Upgrade modal** (`export-action.tsx` + settings): copy changes from "Upgrade to unlock cloud PDF" → **"Get PenPad Pro — £49/mo, self-hosted"**; CTA still hits Stripe Checkout via `startProCheckout`, success → `/settings/license`. During an active trial the modal does not appear (user already has Pro).

### 4.7 Data model
- `auth_user`: add `trial_ends_at timestamptz` (nullable).
- `subscriptions`: add `keygen_license_id text`, `license_key text` (both nullable).
- Migration also backfills `trial_ends_at` for existing users (4.1).

### 4.8 Secrets / config (PREREQUISITE — Connor to create)
- **Keygen account + a "Pro" policy do not exist yet** — Connor creates them at keygen.sh. Policy should be node-locked to a small machine count appropriate for a solo self-hoster.
- New env (Vercel + `.env.local.example`): `KEYGEN_ACCOUNT_ID` (already referenced), `KEYGEN_API_TOKEN` (admin/product token), `KEYGEN_POLICY_ID`.
- Code stays inert with a clear error until these are set, so this ships safely ahead of Keygen setup.

### 4.9 Testing
- Unit: entitlement (trial active / expired / self-hosted license); `keygen.ts` create/suspend/reinstate (mocked fetch); webhook provisioning + lifecycle (mocked Stripe + Keygen).
- Manual: trial signup → Pro features available → simulate expiry (set `trial_ends_at` in past) → locks to free → purchase → license email arrives → drop key into Docker → self-hosted validates Pro → cancel in Stripe → license suspends → self-hosted drops to free.
- `next build`, eslint, tsc clean.

---

## 5. Edge cases & migration
- **Existing 5 cloud users**: backfilled to a fresh 30-day trial (4.1).
- **Existing manual `subscriptions` row** (Connor's 'license' test): harmless — cloud Pro no longer reads it; can be cleaned up.
- **Purchase during trial**: allowed; cloud stays Pro until trial ends, license is available to self-host whenever.
- **Keygen down at purchase time**: webhook logs + flags for manual reconciliation; the dedup table prevents double-provision on Stripe retry (guard: only create a license if the row has no `keygen_license_id`).

---

## 6. Success criteria
1. New cloud signup has full Pro for 30 days, then free; existing users got a fresh trial.
2. A Stripe purchase creates exactly one Keygen license, stores it, emails it, and shows it on `/settings/license` with a working Docker quickstart.
3. A self-hosted instance with that key validates as Pro; cancelling in Stripe suspends it and the instance drops to free.
4. No Stripe subscription grants cloud Pro anywhere.
5. Code is inert (clear error, no crash) until the Keygen env vars are set.
6. `next build` / eslint / tsc clean.

---

## 7. Deliberately deferred
- Cloud→self-hosted data export/import.
- Feature sub-projects 1–7.
- A self-serve license-management portal (explicitly not building a portal).
