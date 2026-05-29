-- findings.report_id — used in every finding query and FK join
CREATE INDEX IF NOT EXISTS findings_report_id_idx
  ON findings (report_id);

-- finding_templates.user_id — used in every template query
CREATE INDEX IF NOT EXISTS finding_templates_user_id_idx
  ON finding_templates (user_id);

-- reports.user_id — used in every report query (dashboard, limit check)
CREATE INDEX IF NOT EXISTS reports_user_id_idx
  ON reports (user_id);

-- subscriptions.user_id — used on every page load for Pro gate
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx
  ON subscriptions (user_id);
