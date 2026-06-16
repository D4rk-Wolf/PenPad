'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

/**
 * Links the anonymous PostHog session to the authenticated user so every event
 * (and any future funnel/replay) attaches to the same person. Mounted in the
 * authenticated app layout only — anonymous visitors are never identified.
 * No-op when PostHog isn't initialized (no token configured).
 */
export function PostHogIdentify({ userId, email }: { userId: string; email: string }) {
  useEffect(() => {
    if (!posthog.__loaded) return
    posthog.identify(userId, { email })
  }, [userId, email])

  return null
}
