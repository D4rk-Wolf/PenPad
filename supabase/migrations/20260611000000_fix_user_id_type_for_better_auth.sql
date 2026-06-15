-- Realign app tables with better-auth.
--
-- The app migrated auth from Supabase Auth (GoTrue: uuid `auth.users`, `auth.uid()`)
-- to better-auth (text ids in `public.auth_user`). But the application tables
-- (reports, subscriptions, finding_templates, user_branding) still had a
-- `user_id uuid` column with a FK to `auth.users(id)`. A better-auth user lives only
-- in public.auth_user, so any write for such a user failed the FK/type check -> no new
-- user could create a report or have a subscription row written (this also silently
-- broke the Stripe webhook's subscription insert). This blocked the whole pay-and-use path.
--
-- DB access is via a direct postgres/Drizzle connection (src/lib/db/index.ts) that
-- bypasses RLS and enforces ownership in app code, so the Supabase-Auth RLS policies
-- (auth.uid() = user_id) are dead. They also block this migration: Postgres refuses to
-- ALTER a column's type while a policy references it. So we drop them first.
--
-- Policies are dropped dynamically because the live DB had drifted from the migration
-- files (extra ALL-command policies added via the dashboard, e.g. "users own reports",
-- "users manage own templates"). Dropping all policies on these tables is robust to that.
--
-- Verified before applying (2026-06-11, project vtdmtnpsybqmcgtdvblu): 0 orphan user_ids
-- vs public.auth_user, so the type change + FK re-target apply cleanly with no data loss.

-- 1. Drop ALL existing (GoTrue-era, auth.uid()-based) RLS policies on these tables.
--    RLS stays ENABLED -> deny-by-default for the Data API; the direct Drizzle
--    connection is unaffected.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('reports','findings','subscriptions','finding_templates','user_branding')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 2. Drop the foreign keys to auth.users.
ALTER TABLE public.reports           DROP CONSTRAINT IF EXISTS reports_user_id_fkey;
ALTER TABLE public.subscriptions     DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE public.finding_templates DROP CONSTRAINT IF EXISTS finding_templates_user_id_fkey;
ALTER TABLE public.user_branding     DROP CONSTRAINT IF EXISTS user_branding_user_id_fkey;

-- 3. Change user_id from uuid to text (better-auth ids are text; existing uuid values
--    cast cleanly to their text form).
ALTER TABLE public.reports           ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.subscriptions     ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.finding_templates ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.user_branding     ALTER COLUMN user_id TYPE text USING user_id::text;

-- 4. Re-target the foreign keys to public.auth_user(id).
ALTER TABLE public.reports           ADD CONSTRAINT reports_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.auth_user(id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions     ADD CONSTRAINT subscriptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.auth_user(id) ON DELETE CASCADE;
ALTER TABLE public.finding_templates ADD CONSTRAINT finding_templates_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.auth_user(id) ON DELETE CASCADE;
ALTER TABLE public.user_branding     ADD CONSTRAINT user_branding_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.auth_user(id) ON DELETE CASCADE;
