# Review Scope

## Target

Production readiness review for PenPad — a Next.js 16.x SaaS application for security professionals to create and manage pentest reports. Targeting June 5 go-live (8 days from review date of May 28, 2026).

## Application Summary

- **Stack**: Next.js 16.2.6 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- **Auth**: Supabase Auth + SSR middleware
- **Database**: Supabase Postgres (via Drizzle ORM + direct supabase-js)
- **Payments**: Stripe (live keys, webhook handler)
- **Monitoring**: Sentry (just configured — @sentry/nextjs 10.54.0)
- **Deployment**: Vercel (project: pen-pad, team: team_jpssOtYFRAyCeEDDksmxV2Mj)
- **PDF Export**: @react-pdf/renderer

## Files

### App Routes
- src/app/layout.tsx — Root layout (fonts, theme, Toaster)
- src/app/page.tsx — Landing page
- src/app/error.tsx — Route error boundary
- src/app/global-error.tsx — Global error boundary (Sentry)
- src/app/not-found.tsx — 404 page
- src/app/privacy/page.tsx — Privacy policy
- src/app/terms/page.tsx — Terms of service
- src/app/(auth)/login/page.tsx — Login page
- src/app/(auth)/signup/page.tsx — Signup page
- src/app/(app)/layout.tsx — Authenticated app layout
- src/app/(app)/loading.tsx — App loading state
- src/app/(app)/dashboard/page.tsx — Dashboard
- src/app/(app)/reports/[id]/page.tsx — Report detail
- src/app/(app)/reports/[id]/export/route.tsx — PDF export route
- src/app/(app)/reports/new/page.tsx — New report
- src/app/(app)/settings/page.tsx — User settings
- src/app/(app)/templates/page.tsx — Templates
- src/app/api/stripe/webhook/route.ts — Stripe webhook

### Server Actions
- src/app/actions/findings.ts — Finding CRUD
- src/app/actions/reports.ts — Report CRUD
- src/app/actions/settings.ts — Settings management
- src/app/actions/templates.ts — Template management

### Components
- src/components/auth/auth-form.tsx — Login/signup form
- src/components/findings/finding-card.tsx
- src/components/findings/finding-form.tsx
- src/components/layout/app-shell.tsx
- src/components/layout/mobile-header.tsx
- src/components/layout/sidebar.tsx
- src/components/pdf/report-document.tsx
- src/components/penpad/brand-mark.tsx
- src/components/penpad/icons.tsx
- src/components/penpad/ui.tsx — Design system primitives
- src/components/reports/report-card.tsx
- src/components/reports/report-form.tsx
- src/components/theme-provider.tsx
- src/components/ui/*.tsx — shadcn/ui components

### Data & Library
- src/lib/db/schema.ts — Drizzle schema
- src/lib/db/index.ts — DB client
- src/lib/db/database.types.ts — Supabase generated types
- src/lib/supabase/client.ts — Browser Supabase client
- src/lib/supabase/server.ts — Server Supabase client
- src/lib/supabase/admin.ts — Admin Supabase client
- src/lib/stripe.ts — Stripe client
- src/lib/templates.ts — Template logic
- src/lib/utils.ts — Utilities
- src/data/mock.ts — Mock data
- src/proxy.ts — Proxy utility

### Config & Infrastructure
- next.config.ts — Next.js + Sentry config + CSP headers
- src/instrumentation.ts — Sentry server init
- src/instrumentation-client.ts — Sentry browser init
- drizzle.config.ts — Drizzle ORM config
- supabase/ — Supabase migrations
- vitest.config.ts — Test config
- src/lib/__tests__/templates.test.ts
- src/lib/__tests__/utils.test.ts
- .gitignore, SECURITY.md, README.md, LICENSE.md

## Flags

- Security Focus: yes (live Stripe keys, auth, user data)
- Performance Critical: no
- Strict Mode: no
- Framework: Next.js 16 App Router

## Review Phases

1. Code Quality & Architecture
2. Security & Performance
3. Testing & Documentation
4. Best Practices & Standards
5. Consolidated Report
