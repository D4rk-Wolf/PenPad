# PenPad Operational Runbook

Audience: D4rkWolf Studios on-call. Last updated: 2026-05-28.

---

## Go-Live Checklist (June 5)

Run through this in order the morning of launch:

- [ ] CI pipeline is green on `main` (`gh run list --branch main`)
- [ ] `pnpm audit` returns no high/critical CVEs
- [ ] Supabase PITR (point-in-time recovery) is enabled — Dashboard → Project → Database → Backups
- [ ] Stripe webhook is registered at `https://pen-pad.vercel.app/api/stripe/webhook` with all 5 events subscribed
- [ ] Vercel project is on Pro plan (required for PDF `maxDuration: 60`)
- [ ] `NEXT_PUBLIC_APP_URL` matches the production URL in Vercel env vars (no trailing slash)
- [ ] Supabase Auth redirect URLs include the production domain
- [ ] Sentry is receiving events — use the `/api/sentry-test?token=<SENTRY_TEST_TOKEN>` endpoint
- [ ] Smoke test: sign up → confirm email → create report → add finding → export PDF
- [ ] Smoke test: upgrade to Pro via Stripe test card 4242 4242 4242 4242
- [ ] Rollback procedure is understood (see below)

---

## Rate Limiting Setup (one-time, post-launch)

### Supabase Auth Rate Limits

Supabase applies rate limiting to all auth endpoints by default. To review or adjust:

1. Supabase Dashboard → Your Project → Authentication → Rate Limits
2. Defaults (per IP, per hour): Sign Up: 3, Sign In: 30, Password Reset: 3
3. Increase Sign In if you expect high legitimate traffic; keep Sign Up low to prevent abuse

### Vercel WAF (PDF Export + Auth Routes)

The PDF export is the main DoS surface. Configure rate limiting in Vercel Dashboard:

1. Vercel Dashboard → Your Project → Firewall → Create Rule
2. **PDF export rule:**
   - Match: Path ends with `/export`
   - Action: Rate Limit
   - Limit: 10 requests / 60 seconds / per IP
3. **Login/signup rule:**
   - Match: Path starts with `/login` OR `/signup`
   - Action: Rate Limit
   - Limit: 20 requests / 60 seconds / per IP

Vercel WAF is included in the Pro plan.

---

## Rollback Procedure

### Quick rollback (< 2 minutes)

1. Vercel Dashboard → Your Project → Deployments
2. Find the last known-good deployment (green checkmark)
3. Click ⋮ → **Promote to Production**
4. Verify the promotion completed in ~30 seconds

### Database rollback

If a migration caused issues:

```bash
# Connect to production DB with direct URL
psql $DATABASE_URL_DIRECT

# Check migration history
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;

# Manual rollback — write inverse SQL
-- (no automatic rollback; always write rollback SQL before deploying a migration)
```

Supabase PITR allows restore to any point in the last 7 days (Pro plan). Contact Supabase support if you need a full restore.

### Stripe rollback

Stripe events cannot be rolled back, but subscriptions can be manually adjusted:

- Cancel erroneously-created subscription: Stripe Dashboard → Customers → find customer → cancel subscription
- Refund a charge: Stripe Dashboard → Payments → find payment → Refund

---

## Incident Response

### Production error spike

1. **Check Sentry** → Issues → sort by "First Seen" or "Events" for the last hour
2. Identify the failing route from the error message and stack trace
3. If the issue is in a Server Action: check `console.error` output in Vercel → Functions → Logs
4. If DB-related: check Supabase → Logs → Postgres Logs

### User can't sign in

Likely causes in order of frequency:

1. Email not confirmed → user should check inbox/spam for confirmation link
2. Supabase Auth service outage → check https://status.supabase.com
3. Session cookie issue → ask user to clear cookies and retry
4. `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` misconfigured in Vercel → check env vars

### PDF export fails / times out

1. Check the finding count on the report — the export cap is 200 findings; above that it will be blocked
2. Check Vercel Functions logs for the `/api/(app)/reports/[id]/export` route
3. If the function timed out: check Vercel project is on Pro plan and `maxDuration: 60` in `vercel.json` is deployed
4. If `@react-pdf/renderer` throws: check for malformed evidence content (very long lines, binary data)

### Stripe webhook failures

1. Stripe Dashboard → Developers → Webhooks → select endpoint → Events tab
2. Look for failed deliveries (HTTP 4xx/5xx responses)
3. Common causes:
   - `STRIPE_WEBHOOK_SECRET` mismatch → re-copy from Stripe Dashboard
   - Cold-start timeout → Vercel function logs will show the error
4. Stripe retries failed webhooks for 72 hours — fix the issue and Stripe will redeliver

To manually replay a specific event:
```
Stripe Dashboard → Developers → Webhooks → Your endpoint → Event → Resend
```

### Subscription not activated after checkout

1. Check Stripe Dashboard → Events → filter `checkout.session.completed` — did the event fire?
2. Check the webhook event in Stripe Dashboard for the response code
3. Check `stripe_events_processed` table to see if the event was processed:
   ```sql
   SELECT * FROM stripe_events_processed WHERE event_id = 'evt_...';
   ```
4. If missing, the webhook failed — resend the event from the Stripe Dashboard

### User deleted account but billing continues

1. Stripe Dashboard → Customers → find by email → cancel subscription immediately
2. Issue a refund for any charge after the deletion date
3. Investigate `settings.ts deleteAccount` — check if Stripe cancel threw an exception

---

## Database Maintenance

### Running migrations manually

```bash
# Apply pending migrations
supabase db push --db-url $DATABASE_URL_DIRECT

# Check migration status
supabase migration list
```

### Checking for slow queries

```sql
-- Top 10 slowest queries (requires pg_stat_statements)
SELECT query, calls, total_exec_time / calls AS avg_ms
FROM pg_stat_statements
ORDER BY avg_ms DESC
LIMIT 10;
```

### Checking RLS policies

```sql
-- Verify RLS is enabled on all user-data tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- rowsecurity should be 't' for: findings, reports, subscriptions, finding_templates
```

---

## Sentry Connection Test

To verify Sentry is working at any time:

1. Add `SENTRY_TEST_TOKEN` to your local `.env.local` (any random string)
2. Set the same value in Vercel env vars
3. Hit the endpoint:
   ```bash
   curl "https://pen-pad.vercel.app/api/sentry-test?token=YOUR_TOKEN"
   ```
4. Expected response: `{"ok":true,"eventId":"...","message":"Test event sent..."}`
5. Check Sentry → Issues — the test event should appear within ~30 seconds

---

## Key Contacts and Links

| Resource | URL |
|---|---|
| Vercel dashboard | https://vercel.com/d4rkwolf/pen-pad |
| Supabase dashboard | https://supabase.com/dashboard/project/[ref] |
| Stripe dashboard | https://dashboard.stripe.com |
| Sentry project | https://sentry.io/organizations/d4rkwolf/projects/pen-pad/ |
| GitHub repository | https://github.com/D4rk-Wolf/PenPad |
| GitHub Actions | https://github.com/D4rk-Wolf/PenPad/actions |
| Supabase status | https://status.supabase.com |
| Vercel status | https://www.vercel-status.com |
| Stripe status | https://status.stripe.com |
