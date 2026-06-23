-- Self-hosted packaging: cloud trial + Keygen license storage.
ALTER TABLE public.auth_user     ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS keygen_license_id text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS license_key       text;

-- Backfill existing users with a fresh 30-day trial so nobody locks instantly.
UPDATE public.auth_user
SET trial_ends_at = now() + interval '30 days'
WHERE trial_ends_at IS NULL;
