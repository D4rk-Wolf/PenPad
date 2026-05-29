CREATE TABLE IF NOT EXISTS stripe_events_processed (
  event_id     text        PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE stripe_events_processed IS
  'Deduplication log for Stripe webhook events. Rows older than 30 days may be safely deleted.';
