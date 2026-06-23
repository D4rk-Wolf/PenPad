CREATE TABLE IF NOT EXISTS public.finding_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id  uuid NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
  data        bytea NOT NULL,
  mime_type   text NOT NULL,
  caption     text,
  sort_order  integer NOT NULL DEFAULT 0,
  byte_size   integer NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finding_images_finding_id_sort_idx
  ON public.finding_images (finding_id, sort_order);
ALTER TABLE public.finding_images ENABLE ROW LEVEL SECURITY;
