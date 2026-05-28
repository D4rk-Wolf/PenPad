import * as Sentry from '@sentry/nextjs'
import type { ErrorEvent } from '@sentry/nextjs'

/**
 * Strip pentest-sensitive fields from Sentry error events before transmission.
 * PenPad stores confidential client data — evidence blobs, vuln descriptions,
 * client names — that must never appear in third-party error reports.
 */
const SENSITIVE_KEYS = new Set([
  'evidence', 'description', 'impact', 'recommendation',
  'clientName', 'scope', 'testerName', 'password',
])
const MAX_STRING_LENGTH = 200

function scrubSensitiveData(event: ErrorEvent): ErrorEvent {
  if (event.extra) {
    const scrubbed: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(event.extra)) {
      if (SENSITIVE_KEYS.has(key)) {
        scrubbed[key] = '[redacted]'
      } else if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
        scrubbed[key] = value.slice(0, MAX_STRING_LENGTH) + '…[truncated]'
      } else {
        scrubbed[key] = value
      }
    }
    event.extra = scrubbed
  }
  return event
}

/**
 * Browser-side Sentry initialization.
 * This file is loaded automatically by Next.js for all client bundles,
 * including unauthenticated pages.
 *
 * Session Replay is intentionally NOT initialized here — it is added lazily
 * only for authenticated users via SentryReplayActivator in the app layout.
 * This prevents recording anonymous/unauthenticated visitors.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 100% of transactions in development; lower in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Replay is added dynamically after authentication — see components/sentry-replay-activator.tsx.
  // Sample rates here are inert until the integration is actually added for authenticated users.
  // 5% session sampling; 100% on error — applied only when SentryReplayActivator runs.
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  beforeSend: scrubSensitiveData,

  debug: false,
})
