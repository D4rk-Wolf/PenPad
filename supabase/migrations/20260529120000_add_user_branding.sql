-- Pro feature: per-user PDF branding (company name + brand colour)
CREATE TABLE public.user_branding (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name  TEXT,
  primary_color TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_branding_owner"
  ON public.user_branding
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX user_branding_user_id_idx ON public.user_branding (user_id);
