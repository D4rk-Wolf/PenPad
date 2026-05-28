# PenPad

A clean, enterprise-grade penetration testing report generator developed by **D4rkWolf Studios**. PenPad streamlines the reporting process for pen testers by allowing them to log findings, score them using CVSS v3.1, automatically derive severities, organise findings dynamically, manage reusable templates, and generate clean, client-ready PDF reports.

## 🚀 Key Features

- **Engagement Management**: Log and track multiple reports with fields for client name, test scope, testing window dates, and lead tester.
- **Dynamic Findings Log**: Record findings under each report with CVSS scoring, automatic severity level categorisation, technical description, impact, recommendations, and code/log evidence.
- **CVSS v3.1 Scoring System**: Severity levels (`Critical`, `High`, `Medium`, `Low`, `Info`) are automatically derived based on the input CVSS score.
- **Curated Finding Templates**: Pre-fill common security findings using a built-in library of 20 templates across three categories:
  - **OWASP Web Top 10** (SQL Injection, XSS, SSRF, Broken Access Control, and more)
  - **OWASP API Top 10** (BOLA/IDOR, Broken API Auth, Excess Data Exposure, and more)
  - **Infrastructure** (Default Credentials, Exposed Admin Services, Outdated OS, and more)
- **Custom Templates (Pro)**: Save any documented finding directly as a custom template to your personal library.
- **Enterprise PDF Generation (Pro)**: Generate and download professionally structured PDF reports with a single click — cover page, executive summary, and detailed finding breakdown.
- **Subscription Tier Control**: Stripe Billing automatically gates Pro features (custom templates, PDF export, unlimited reports).

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, React 19) |
| Styling | Tailwind CSS v4 + custom design tokens |
| Database | [Supabase](https://supabase.com) (PostgreSQL with Row Level Security) |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) |
| Migrations | Supabase native migrations (`supabase/migrations/`) |
| Payments | [Stripe](https://stripe.com) (subscriptions + webhooks) |
| PDF | [@react-pdf/renderer](https://react-pdf.org/) |
| Monitoring | [Sentry](https://sentry.io) (errors, tracing, authenticated session replay) |
| Hosting | [Vercel](https://vercel.com) |

## 📐 Architecture

```
Browser  ──→  Next.js App Router (Vercel)
                │
                ├── Server Components  ──→  Supabase (via adminDb / service role)
                ├── Server Actions     ──→  Validated with Zod, auth-guarded
                ├── API Routes         ──→  /api/stripe/webhook, /api/pdf/[id]
                └── Middleware (proxy.ts) ─→  Auth session refresh + route protection

Supabase  ─── PostgreSQL (RLS enabled) + Auth (email/password + email confirmation)
Stripe    ─── Checkout, Customer Portal, Webhook (idempotent via stripe_events_processed)
Sentry    ─── Error tracking + Session Replay (authenticated users only, privacy-masked)
```

### Request Flow

1. **Anonymous request** → `proxy.ts` checks session; redirects to `/login` if missing
2. **Authenticated request** → Server Component fetches data using `adminDb()` (service role, server-only)
3. **Form submission** → Server Action validates input via Zod, checks auth via `createClient()`, writes via `adminDb()`
4. **Subscription check** → `getMySubscription()` (React `cache()` — deduplicated per request)
5. **PDF export** → `/api/pdf/[id]` streams rendered PDF; 30 s render timeout

### Subscription Gating

- Free tier: up to 10 reports, no custom templates, no PDF export
- Pro tier (`status = 'active'`): unlimited reports, custom templates, PDF export
- Status synced from Stripe via webhook events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`

## 📂 Project Structure

```
src/
├── app/
│   ├── (app)/          # Authenticated pages — dashboard, reports, settings, templates
│   ├── (auth)/         # Login, signup, email confirmation
│   ├── (legal)/        # Privacy policy, terms of service
│   ├── actions/        # Server Actions (findings, reports, templates, settings)
│   └── api/            # Route handlers (Stripe webhook, PDF export)
├── components/
│   ├── findings/       # FindingForm, FindingCard, FindingList
│   ├── reports/        # ReportForm, ReportTable
│   ├── pdf/            # React-PDF document layout
│   ├── layout/         # AppShell, Sidebar, Header
│   └── penpad/         # Design system (ui.tsx, tokens, icons)
├── lib/
│   ├── db/             # Drizzle schema, database types
│   ├── supabase/       # Client (browser/server/admin) helpers
│   ├── stripe.ts       # Stripe singleton (server-only)
│   ├── subscriptions.ts # getMySubscription() — cached, IDOR-safe
│   └── templates.ts    # Curated finding templates
└── instrumentation*.ts # Sentry initialisation (server + client)

supabase/
└── migrations/         # SQL migrations applied in order by CI and Supabase CLI
```

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `reports` | Engagement metadata (client, scope, timeline, status, owner) |
| `findings` | Findings attached to a report (CVSS, description, impact, recommendation, evidence) |
| `subscriptions` | User subscription state synced from Stripe |
| `finding_templates` | Custom reusable templates (Pro users only) |
| `stripe_events_processed` | Webhook idempotency log (deduplicates Stripe event delivery) |

All tables have RLS enabled. All user-data tables have `ON DELETE CASCADE` foreign keys to `auth.users` so account deletion is clean.

## ⚙️ Getting Started

### Prerequisites

- Node.js 20+
- `pnpm` (required — the project uses a pnpm lockfile)
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account with a Pro product/price created
- A [Sentry](https://sentry.io) project (Next.js SDK)

### 1. Clone & Install

```bash
git clone <repo-url>
cd penpad
pnpm install
```

### 2. Environment Variables

Copy the example file and fill in all values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (`https://<ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key — safe to expose in the browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — **server-only, never expose** |
| `DATABASE_URL` | Pooler connection string (port 6543) — used by the app at runtime |
| `DATABASE_URL_DIRECT` | Direct connection string (port 5432) — used only for migrations |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_…` or `sk_test_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_live_…` or `pk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`) from Stripe Dashboard |
| `STRIPE_PRO_PRICE_ID` | Price ID for the Pro subscription (`price_…`) |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL, e.g. `https://app.example.com` (no trailing slash) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN — safe to expose in the browser |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source-map uploads — **CI/server only** |

> **Tip:** The `DATABASE_URL` (pooler) and `DATABASE_URL_DIRECT` (direct) are different connection strings. Use the pooler for the app and the direct connection for schema migrations.

### 3. Database Migrations

Apply all migrations to your Supabase project using the Supabase CLI:

```bash
# Install Supabase CLI if needed
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-ref>

# Push migrations
supabase db push
```

Migrations live in `supabase/migrations/` and are applied in timestamp order. The CI pipeline also runs migrations automatically on every push to `main`.

### 4. Supabase Auth Configuration

In your Supabase Dashboard → **Authentication → URL Configuration**, add these redirect URLs:

```
https://<your-domain>/auth/callback
https://<your-domain>/auth/confirm
http://localhost:3000/auth/callback    # local dev
http://localhost:3000/auth/confirm     # local dev
```

Also set **Site URL** to your production domain.

### 5. Stripe Webhook

Register your webhook endpoint in the Stripe Dashboard:

- **URL**: `https://<your-domain>/api/stripe/webhook`
- **Events to listen for**:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `customer.subscription.paused`
  - `invoice.payment_failed`

Copy the signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET`.

For local testing, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 6. Run Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🚢 Deployment (Vercel)

### First Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Link and deploy
vercel link
vercel env pull .env.local  # pulls Vercel env vars locally
vercel deploy --prod
```

### Environment Variables on Vercel

Set all variables from `.env.local.example` in the Vercel Dashboard under **Settings → Environment Variables**. Scope `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SENTRY_AUTH_TOKEN` to **Production + Preview** only (never Development).

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/`) runs on every push:

1. **Secret scan** (gitleaks) — blocks commits with leaked credentials
2. **Dependency audit** (`pnpm audit`) — flags known CVEs
3. **Type check + lint** (`tsc --noEmit`, `eslint`)
4. **Database migrations** — applies `supabase/migrations/` to production
5. **Deploy** — triggers Vercel production deployment

Required GitHub secrets (set in **Settings → Secrets → Actions**):

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` |
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token |
| `SUPABASE_PROJECT_REF` | Your Supabase project ref |
| `SUPABASE_DB_PASSWORD` | Your Supabase database password |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source-map uploads |

## 🔐 Security

- **Row Level Security** is enabled on all tables — users can only access their own data
- **Input validation** via Zod on all Server Actions (field length caps, type coercion)
- **Server-only** guard on `admin.ts` and `stripe.ts` — service-role key never reaches the browser
- **Webhook signature verification** on every Stripe event + idempotency deduplication
- **Stripe redirect validation** — redirects are checked to be `*.stripe.com` before following
- **CSP headers** configured in `next.config.ts`
- **Sentry Session Replay** only activates for authenticated users; all text masked, media blocked
- **Security disclosure**: `/.well-known/security.txt`

## 🧪 Testing

```bash
pnpm test          # run unit tests once (Vitest)
pnpm test:watch    # watch mode
pnpm lint          # ESLint
pnpm build         # type-check + production build
```

> **Note:** Integration and E2E test coverage is a known gap — tracked as a backlog item.

## 🛡️ License

Developed by D4rkWolf Studios. All rights reserved.
