-- ============================================================================
-- One-time data migration: Supabase Auth -> better-auth
-- ============================================================================
--
-- CLOUD ONLY. Run this ONCE against the production Supabase database AFTER the
-- better-auth tables exist (migration 20260603000000_auth_tables.sql) and
-- BEFORE the better-auth code is deployed/promoted to production.
--
-- It copies every existing Supabase Auth user (auth.users) into the better-auth
-- auth_user + auth_account tables, PRESERVING the user UUID. Because all existing
-- reports/findings/subscriptions are keyed by that UUID, they stay linked with no
-- further data changes.
--
-- Passwords carry over verbatim: Supabase stores $2a$ bcrypt hashes and the
-- better-auth config (src/lib/auth/index.ts) is set to verify bcrypt, so existing
-- users keep their current passwords — no reset required.
--
-- Idempotent: ON CONFLICT DO NOTHING means re-running is safe.
--
-- Only migrates users that have a password (encrypted_password IS NOT NULL).
-- OAuth-only users (none currently) would need a separate path.
-- ============================================================================

-- 1. Copy users into auth_user (preserve UUID id)
INSERT INTO public.auth_user (id, name, email, email_verified, image, created_at, updated_at)
SELECT
  u.id::text,
  COALESCE(
    NULLIF(u.raw_user_meta_data->>'full_name', ''),
    NULLIF(u.raw_user_meta_data->>'name', ''),
    split_part(u.email, '@', 1)
  )                                   AS name,
  u.email,
  (u.email_confirmed_at IS NOT NULL)  AS email_verified,
  NULLIF(u.raw_user_meta_data->>'avatar_url', '') AS image,
  u.created_at,
  COALESCE(u.updated_at, u.created_at) AS updated_at
FROM auth.users u
WHERE u.encrypted_password IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 2. Copy password hashes into auth_account (credential provider)
--    better-auth convention: provider_id='credential', account_id = user id.
INSERT INTO public.auth_account (id, account_id, provider_id, user_id, password, created_at, updated_at)
SELECT
  gen_random_uuid()::text   AS id,
  u.id::text                AS account_id,
  'credential'              AS provider_id,
  u.id::text                AS user_id,
  u.encrypted_password      AS password,
  u.created_at,
  COALESCE(u.updated_at, u.created_at) AS updated_at
FROM auth.users u
WHERE u.encrypted_password IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.auth_account a
    WHERE a.user_id = u.id::text AND a.provider_id = 'credential'
  );

-- 3. Verification: row counts should match the number of password users.
--    Run manually after the inserts:
--   SELECT
--     (SELECT count(*) FROM auth.users WHERE encrypted_password IS NOT NULL) AS supabase_pw_users,
--     (SELECT count(*) FROM public.auth_user)    AS better_auth_users,
--     (SELECT count(*) FROM public.auth_account WHERE provider_id='credential') AS credential_accounts;
