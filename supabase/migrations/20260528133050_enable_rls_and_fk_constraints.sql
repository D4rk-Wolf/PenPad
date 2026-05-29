-- ── Foreign key constraints (idempotent via DO blocks) ────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reports_user_id_fkey' AND table_name = 'reports'
  ) THEN
    ALTER TABLE reports ADD CONSTRAINT reports_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'findings_report_id_fkey' AND table_name = 'findings'
  ) THEN
    ALTER TABLE findings ADD CONSTRAINT findings_report_id_fkey
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_user_id_fkey' AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'finding_templates_user_id_fkey' AND table_name = 'finding_templates'
  ) THEN
    ALTER TABLE finding_templates ADD CONSTRAINT finding_templates_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ── Enable RLS ─────────────────────────────────────────────────────────────────

ALTER TABLE reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE finding_templates ENABLE ROW LEVEL SECURITY;

-- ── reports policies ───────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reports_select_own' AND tablename = 'reports') THEN
    CREATE POLICY "reports_select_own" ON reports FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reports_insert_own' AND tablename = 'reports') THEN
    CREATE POLICY "reports_insert_own" ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reports_update_own' AND tablename = 'reports') THEN
    CREATE POLICY "reports_update_own" ON reports FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'reports_delete_own' AND tablename = 'reports') THEN
    CREATE POLICY "reports_delete_own" ON reports FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── findings policies ──────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'findings_select_own' AND tablename = 'findings') THEN
    CREATE POLICY "findings_select_own" ON findings FOR SELECT USING (
      EXISTS (SELECT 1 FROM reports WHERE reports.id = findings.report_id AND reports.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'findings_insert_own' AND tablename = 'findings') THEN
    CREATE POLICY "findings_insert_own" ON findings FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM reports WHERE reports.id = findings.report_id AND reports.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'findings_update_own' AND tablename = 'findings') THEN
    CREATE POLICY "findings_update_own" ON findings FOR UPDATE
      USING  (EXISTS (SELECT 1 FROM reports WHERE reports.id = findings.report_id AND reports.user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM reports WHERE reports.id = findings.report_id AND reports.user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'findings_delete_own' AND tablename = 'findings') THEN
    CREATE POLICY "findings_delete_own" ON findings FOR DELETE USING (
      EXISTS (SELECT 1 FROM reports WHERE reports.id = findings.report_id AND reports.user_id = auth.uid())
    );
  END IF;
END $$;

-- ── subscriptions policies ─────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'subscriptions_select_own' AND tablename = 'subscriptions') THEN
    CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── finding_templates policies ─────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'templates_select_own' AND tablename = 'finding_templates') THEN
    CREATE POLICY "templates_select_own" ON finding_templates FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'templates_insert_own' AND tablename = 'finding_templates') THEN
    CREATE POLICY "templates_insert_own" ON finding_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'templates_update_own' AND tablename = 'finding_templates') THEN
    CREATE POLICY "templates_update_own" ON finding_templates FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'templates_delete_own' AND tablename = 'finding_templates') THEN
    CREATE POLICY "templates_delete_own" ON finding_templates FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
