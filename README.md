# PenPad

A clean, enterprise-grade penetration testing report generator developed by **D4rkWolf Studios**. PenPad streamlines the reporting process for pen testers by allowing them to log findings, score them using CVSS v3.1, automatically derive severities, organize findings dynamically, manage reusable templates, and generate clean, client-ready PDF reports.

## 🚀 Key Features

- **Engagement Management**: Log and track multiple reports with fields for client name, test scope, testing window dates, and lead tester.
- **Dynamic Findings Log**: Record findings under each report with CVSS scoring, automatic severity level categorization, technical description, impact, recommendations, and code/log evidence.
- **CVSS v3.1 Scoring System**: Severity levels (`Critical`, `High`, `Medium`, `Low`, `Info`) are automatically derived dynamically based on the input CVSS score.
- **Curated Finding Templates**: Pre-fill common security findings using a built-in library of 20 templates across three categories:
  - **OWASP Web Top 10** (10 entries including SQL Injection, XSS, SSRF, Broken Access Control)
  - **OWASP API Top 10** (5 entries including BOLA/IDOR, Broken API Auth, Excess Data Exposure)
  - **Infrastructure** (5 entries including Default Credentials, Exposed Admin Services, Outdated OS)
- **Custom Templates (Pro)**: Save any documented finding directly as a custom template to your personal library for future use.
- **Enterprise PDF Generation (Pro)**: Generate and download beautifully structured PDF reports with a single click, featuring a cover page, executive summary, and detailed finding breakdown.
- **Subscription Tier Control**: Integrated Stripe Billing that automatically gates Pro features like custom templates and PDF export.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, React 19)
- **Styling**: Tailwind CSS v4 (Clean Enterprise aesthetic with Inter typography)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL instance with Row Level Security (RLS) policies)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **PDF Generation**: [@react-pdf/renderer](https://react-pdf.org/)
- **Payments & Subscriptions**: [Stripe](https://stripe.com)
- **Testing**: [Vitest](https://vitest.dev)

## 📂 Project Structure

- `src/app/(app)/` - The core application pages (dashboard, reports, settings, templates)
- `src/app/(auth)/` - Authentication pages (login, signup)
- `src/app/actions/` - Next.js Server Actions handling business logic (findings, reports, templates)
- `src/app/api/` - API route handlers (e.g., Stripe webhook listener)
- `src/components/` - Reusable UI, auth forms, finding cards, and report tables
- `src/components/pdf/` - React-PDF document design layouts for exporting reports
- `src/lib/` - DB configurations, Stripe client, Supabase client setups, and static template constants

## 🗄️ Database Schema

The database model is defined via Drizzle ORM in `src/lib/db/schema.ts` and maps to the following Postgres tables:
1. `reports`: Stores engagement metadata (client, scope, timeline, status, owner).
2. `findings`: Stores findings attached to a report (title, cvss_score, description, impact, recommendation, evidence, sort_order).
3. `subscriptions`: Manages user subscription state mapped from Stripe (stripe_customer_id, stripe_subscription_id, status, current_period_end).
4. `finding_templates`: Stores custom reusable templates saved by Pro users.

## ⚙️ Getting Started

### 1. Prerequisites
Make sure you have Node.js, `pnpm` (recommended package manager), and a Supabase/PostgreSQL instance ready.

### 2. Environment Setup
Clone the repository and create a `.env.local` file based on `.env.local.example`:
```bash
cp .env.local.example .env.local
```
Fill in the credentials for:
- Supabase API credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- PostgreSQL connection string (`DATABASE_URL`)
- Stripe Integration secrets (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`)
- Base Application URL (`NEXT_PUBLIC_APP_URL`)

### 3. Installation
Install dependencies:
```bash
pnpm install
```

### 4. Database Setup
Push the Drizzle schema to your Supabase/PostgreSQL database:
```bash
pnpm db:push
```

### 5. Running the Application
Start the development server:
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 6. Running Tests
Run the unit test suite:
```bash
pnpm test
```

## 🛡️ License

Developed by D4rkWolf Studios. All rights reserved.
