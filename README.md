# PenPad

A penetration testing report generator developed by **D4rkWolf Studios**. PenPad streamlines the reporting process for pen testers — log findings, score with CVSS v3.1, manage reusable templates, and generate client-ready PDF reports.

## Key Features

- **Engagement Management** — track reports with client name, scope, testing window, and lead tester
- **Dynamic Findings Log** — CVSS scoring, automatic severity derivation, description, impact, recommendations, and evidence
- **Curated Finding Templates** — 20 templates across OWASP Web Top 10, OWASP API Top 10, and Infrastructure
- **Custom Templates (Pro)** — save any finding as a personal reusable template
- **PDF Export (Pro)** — professionally structured reports with cover page, executive summary, and finding breakdown
- **Subscription Gating** — Stripe Billing gates Pro features automatically

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS v4 + custom design tokens |
| Database | Supabase (PostgreSQL + Row Level Security) |
| ORM | Drizzle ORM |
| Payments | Stripe (subscriptions + webhooks) |
| PDF | @react-pdf/renderer |
| Monitoring | Sentry (errors, tracing, authenticated session replay) |
| Hosting | Vercel |

## Architecture

```
Browser  ──→  Next.js App Router (Vercel)
                │
                ├── Server Components  ──→  Supabase (via adminDb / service role)
                ├── Server Actions     ──→  Validated with Zod, auth-guarded
                ├── API Routes         ──→  /api/stripe/webhook, /api/pdf/[id]
                └── proxy.ts           ──→  Auth session refresh + route protection

Supabase  ─── PostgreSQL (RLS enabled) + Auth (email/password + email confirmation)
Stripe    ─── Checkout, Customer Portal, Webhook (idempotent via stripe_events_processed)
Sentry    ─── Error tracking + Session Replay (authenticated users only, privacy-masked)
```

**Request flow:**
1. Anonymous request → `proxy.ts` checks session; redirects to `/login` if missing
2. Authenticated request → Server Component fetches via `adminDb()` (service role, server-only)
3. Form submission → Server Action validates via Zod, checks auth, writes via `adminDb()`
4. Subscription check → `getMySubscription()` with `React.cache()` — deduplicated per request
5. PDF export → `/api/pdf/[id]` streams rendered PDF with a 30 s render timeout

**Subscription tiers:**
- Free: up to 3 reports, 10 findings each, no custom templates, no PDF export
- Pro (`status = 'active'`): unlimited reports and findings, custom templates, PDF export
- Status synced from Stripe via: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Authenticated pages — dashboard, reports, settings, templates
│   ├── (auth)/         # Login, signup, email confirmation
│   ├── actions/        # Server Actions (findings, reports, templates, settings)
│   └── api/            # Route handlers (Stripe webhook, PDF export)
├── components/
│   ├── findings/       # FindingForm, FindingCard
│   ├── reports/        # ReportForm, ReportCard
│   ├── pdf/            # React-PDF document layout
│   ├── layout/         # AppShell, Sidebar, Header
│   └── penpad/         # Design system (ui.tsx, tokens, icons)
└── lib/
    ├── db/             # Drizzle schema + generated types
    ├── supabase/       # Client helpers (browser / server / admin)
    ├── stripe.ts       # Stripe singleton (server-only)
    ├── subscriptions.ts # getMySubscription() — cached, IDOR-safe
    └── validations.ts  # Shared Zod schemas

supabase/migrations/    # SQL migrations — applied in timestamp order by CI
```

## Database Schema

| Table | Purpose |
|---|---|
| `reports` | Engagement metadata (client, scope, timeline, status, owner) |
| `findings` | Findings per report (CVSS, description, impact, recommendation, evidence) |
| `subscriptions` | Subscription state synced from Stripe |
| `finding_templates` | Custom reusable templates (Pro only) |
| `stripe_events_processed` | Webhook idempotency log |

RLS is enabled on all tables. All user-data tables cascade-delete on `auth.users` removal.

## Security

- RLS on all tables — users can only access their own data
- Zod validation on all Server Actions (length caps, type coercion)
- `server-only` guard on `admin.ts` and `stripe.ts` — service-role key never reaches the browser
- Webhook HMAC verification + idempotency deduplication on every Stripe event
- Stripe redirect validation — URLs checked against `*.stripe.com` before following
- Security headers in `next.config.ts` (CSP, HSTS, X-Frame-Options, Permissions-Policy)
- Sentry Session Replay only activates for authenticated users; all text masked, media blocked
- Vulnerability disclosure: `/.well-known/security.txt`

---

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, testing, and deployment instructions.

## Licence

Developed by D4rkWolf Studios. All rights reserved.
