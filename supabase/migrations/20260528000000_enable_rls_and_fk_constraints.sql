-- ============================================================
-- Migration: Enable RLS and add FK constraints
-- Date: 2026-05-28
-- Context: All app queries use the service-role key (adminDb) which
--          bypasses RLS. These policies protect against direct REST API
--          access via the anon key and add data integrity via FK constraints.
-- ============================================================

-- ── Foreign key constraints ────────────────────────────────────────────────────

-- reports.user_id → auth.users(id)
alter table reports
  add constraint if not exists reports_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- findings.report_id → reports(id)  [cascade deletes findings when report is removed]
alter table findings
  add constraint if not exists findings_report_id_fkey
  foreign key (report_id) references reports(id) on delete cascade;

-- subscriptions.user_id → auth.users(id)
alter table subscriptions
  add constraint if not exists subscriptions_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- finding_templates.user_id → auth.users(id)
alter table finding_templates
  add constraint if not exists finding_templates_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- ── Enable RLS ─────────────────────────────────────────────────────────────────

alter table reports           enable row level security;
alter table findings          enable row level security;
alter table subscriptions     enable row level security;
alter table finding_templates enable row level security;

-- ── reports policies ───────────────────────────────────────────────────────────

create policy "reports_select_own" on reports
  for select
  using (auth.uid() = user_id);

create policy "reports_insert_own" on reports
  for insert
  with check (auth.uid() = user_id);

create policy "reports_update_own" on reports
  for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "reports_delete_own" on reports
  for delete
  using (auth.uid() = user_id);

-- ── findings policies ──────────────────────────────────────────────────────────
-- Access is via report ownership; no direct user_id on this table.

create policy "findings_select_own" on findings
  for select
  using (
    exists (
      select 1 from reports
      where reports.id = findings.report_id
        and reports.user_id = auth.uid()
    )
  );

create policy "findings_insert_own" on findings
  for insert
  with check (
    exists (
      select 1 from reports
      where reports.id = findings.report_id
        and reports.user_id = auth.uid()
    )
  );

create policy "findings_update_own" on findings
  for update
  using (
    exists (
      select 1 from reports
      where reports.id = findings.report_id
        and reports.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from reports
      where reports.id = findings.report_id
        and reports.user_id = auth.uid()
    )
  );

create policy "findings_delete_own" on findings
  for delete
  using (
    exists (
      select 1 from reports
      where reports.id = findings.report_id
        and reports.user_id = auth.uid()
    )
  );

-- ── subscriptions policies ─────────────────────────────────────────────────────
-- Users can read their own subscription; all writes go through the Stripe
-- webhook handler which uses the service-role key (bypasses RLS).

create policy "subscriptions_select_own" on subscriptions
  for select
  using (auth.uid() = user_id);

-- ── finding_templates policies ─────────────────────────────────────────────────

create policy "templates_select_own" on finding_templates
  for select
  using (auth.uid() = user_id);

create policy "templates_insert_own" on finding_templates
  for insert
  with check (auth.uid() = user_id);

create policy "templates_update_own" on finding_templates
  for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "templates_delete_own" on finding_templates
  for delete
  using (auth.uid() = user_id);
