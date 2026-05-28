import * as Sentry from '@sentry/nextjs'

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

  debug: false,
})
