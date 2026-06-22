-- AI draft usage counter (cloud trial rate limiting).
-- RLS enabled with NO policies = deny-by-default for the Data API; the app
-- reaches this table via the direct Drizzle connection, which bypasses RLS.
-- Do NOT add auth.uid() policies — auth.uid() is dead under better-auth.
create table if not exists ai_usage (
  user_id    text    not null,
  usage_date date    not null,
  count      integer not null default 0,
  primary key (user_id, usage_date)
);

alter table ai_usage enable row level security;
