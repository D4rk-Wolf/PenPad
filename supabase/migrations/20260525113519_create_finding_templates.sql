CREATE TABLE finding_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  cvss_score      numeric(3,1),
  severity        text,
  impact          text,
  recommendation  text,
  evidence        text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE finding_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own templates"
  ON finding_templates FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
