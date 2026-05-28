'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

/**
 * Activates Sentry Session Replay once the user is authenticated.
 * Rendered inside the authenticated app layout so it never runs for
 * anonymous visitors (landing page, login, signup, legal pages).
 *
 * Uses Sentry.addIntegration() so replay is initialized once and not
 * duplicated on subsequent navigations.
 */
export function SentryReplayActivator() {
  useEffect(() => {
    const client = Sentry.getClient()
    if (!client) return

    // Only activate if not already present
    const existing = client.getIntegrationByName?.('Replay')
    if (existing) return

    client.addIntegration(
      Sentry.replayIntegration({
        maskAllText:   true,  // Mask all text for privacy (pentest data!)
        blockAllMedia: true,  // Block screenshots and media
        // Sample rates (replaysSessionSampleRate / replaysOnErrorSampleRate) are
        // configured in instrumentation-client.ts via Sentry.init — they are not
        // accepted as ReplayConfiguration options.
      }),
    )
  }, [])

  return null
}
