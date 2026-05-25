alter table findings
  add column if not exists affected_component text;
