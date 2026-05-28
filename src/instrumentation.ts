import * as Sentry from '@sentry/nextjs'

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

      // Print debug output in development only
      debug: false,
    })
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      debug: false,
    })
  }
}

/**
 * Captures server-side request errors (Next.js 15+ App Router).
 * Automatically attaches route, method, and status code.
 */
export const onRequestError = Sentry.captureRequestError
