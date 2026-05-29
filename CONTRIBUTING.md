# Contributing to PenPad

Internal guide for D4rkWolf Studios developers.

---

## Prerequisites

- Node.js 20+
- `pnpm` (required — project uses a pnpm lockfile)
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account with a Pro product/price created
- A [Sentry](https://sentry.io) project (Next.js SDK)

---

## Local Setup

```bash
git clone <repo-url>
cd penpad
pnpm install
cp .env.local.example .env.local   # then fill in all values
```

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://<ref>.supabase.co`) |
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

> `DATABASE_URL` (pooler, port 6543) and `DATABASE_URL_DIRECT` (direct, port 5432) are different strings. Use the pooler for the app; direct for schema migrations.

### Database Migrations

```bash
pnpm db:migrate   # applies all pending migrations via DATABASE_URL_DIRECT
```

Migrations live in `supabase/migrations/` and run in timestamp order. CI also runs them automatically on every push to `main`.

### Supabase Auth Configuration

In the Supabase Dashboard → **Authentication → URL Configuration**, add these redirect URLs:

```
https://<your-domain>/auth/callback
https://<your-domain>/auth/confirm
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
```

Set **Site URL** to your production domain.

### Stripe Webhook (local testing)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Required events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `invoice.payment_failed`.

Copy the printed signing secret into `STRIPE_WEBHOOK_SECRET` in `.env.local`.

### Run Dev Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Testing

```bash
pnpm test          # run unit tests once (Vitest)
pnpm test:watch    # watch mode
pnpm lint          # ESLint
pnpm tsc --noEmit  # type-check only
pnpm build         # full production build
```

> Integration and E2E coverage is a known backlog item.

---

## Deployment (Vercel)

### First Deploy

```bash
vercel link
vercel env pull .env.local   # pulls Vercel env vars locally
vercel deploy --prod
```

### Environment Variables on Vercel

Set all variables from `.env.local.example` in **Settings → Environment Variables**. Scope `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SENTRY_AUTH_TOKEN` to **Production + Preview** only.

### CI/CD Pipeline

The GitHub Actions workflow runs on every push to `main`:

1. **Secret scan** (gitleaks) — blocks commits with leaked credentials
2. **Dependency audit** (`pnpm audit`) — flags known CVEs
3. **Quality gate** (`tsc --noEmit`, `eslint`, `vitest`)
4. **Database migrations** — applies `supabase/migrations/` to production
5. **Deploy** — triggers Vercel production deployment

Required GitHub Actions secrets:

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` |
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token |
| `SUPABASE_PROJECT_REF` | Your Supabase project ref |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source-map uploads |
| `NEXT_PUBLIC_SUPABASE_URL` | Used during CI build |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Used during CI build |
| `NEXT_PUBLIC_SENTRY_DSN` | Used during CI build |
