import type { Config } from 'drizzle-kit'

// Self-hosted migration lineage. Independent from the cloud Supabase history
// (supabase/migrations/), this produces a clean, complete baseline from the
// Drizzle schema so `drizzle-kit migrate` can build a fresh Postgres from empty
// and apply forward-only, reviewable migrations over time.
export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
