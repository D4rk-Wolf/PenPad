
-- Tables
create table reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  client_name text not null,
  scope       text,
  start_date  date,
  end_date    date,
  tester_name text,
  status      text default 'draft' not null,
  created_at  timestamptz default now() not null
);

create table findings (
  id              uuid primary key default gen_random_uuid(),
  report_id       uuid references reports on delete cascade not null,
  title           text not null,
  description     text,
  cvss_score      numeric(3,1),
  severity        text,
  impact          text,
  recommendation  text,
  evidence        text,
  sort_order      integer default 0,
  created_at      timestamptz default now() not null
);

create table subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users not null unique,
  stripe_customer_id     text,
  stripe_subscription_id text,
  status                 text,
  current_period_end     timestamptz,
  updated_at             timestamptz default now() not null
);

-- RLS
alter table reports       enable row level security;
alter table findings      enable row level security;
alter table subscriptions enable row level security;

create policy "users own reports" on reports
  for all using (auth.uid() = user_id);

create policy "users own findings" on findings
  for all using (
    exists (
      select 1 from reports
      where reports.id = findings.report_id
        and reports.user_id = auth.uid()
    )
  );

create policy "users own subscription" on subscriptions
  for all using (auth.uid() = user_id);
