-- ============================================================
-- Migration: Stripe webhook event deduplication table
-- Date: 2026-05-28
-- Purpose: Prevent double-processing of webhook events that Stripe
--          may deliver more than once (at-least-once delivery guarantee).
-- ============================================================

create table if not exists stripe_events_processed (
  event_id     text        primary key,
  processed_at timestamptz not null default now()
);

-- Prune events older than 30 days to prevent unbounded table growth.
-- The 30-day window is well beyond Stripe's retry window (typically 3 days).
comment on table stripe_events_processed is
  'Deduplication log for Stripe webhook events. Rows older than 30 days may be safely deleted.';
