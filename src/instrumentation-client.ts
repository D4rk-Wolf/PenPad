import * as Sentry from '@sentry/nextjs'

/**
 * Browser-side Sentry initialization.
 * This file is loaded automatically by Next.js for client bundles.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 100% of transactions in development; tune down in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Session Replay — records a video-like reproduction of user sessions
  // Low sample rate in production to keep quota usage reasonable
  replaysSessionSampleRate: 0.05,
  // Always replay sessions that contain an error
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block all media by default for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  debug: false,
})
