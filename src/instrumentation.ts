import * as Sentry from '@sentry/nextjs'
import type { ErrorEvent } from '@sentry/nextjs'

/**
 * Strip pentest-sensitive fields from Sentry error events before transmission.
 * PenPad stores confidential client data — evidence blobs, vuln descriptions,
 * client names — that must never appear in third-party error reports.
 * Mirrors the same filter in instrumentation-client.ts.
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
 * Next.js instrumentation hook — called once per server/edge runtime startup.
 * NEXT_RUNTIME is 'nodejs' for the Node.js server and 'edge' for the edge runtime.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Capture 100% of transactions in development; tune down in production
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

      beforeSend: scrubSensitiveData,

      debug: false,
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      beforeSend: scrubSensitiveData,
      debug: false,
    })
  }
}

/**
 * Captures server-side request errors (Next.js 15+ App Router).
 * Automatically attaches route, method, and status code.
 */
export const onRequestError = Sentry.captureRequestError
