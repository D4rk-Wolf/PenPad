import 'server-only'
import { PostHog } from 'posthog-node'

/**
 * Server-side PostHog capture.
 *
 * Inert until `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is set — so this is safe to
 * ship before a PostHog project exists; it simply no-ops. When the token is
 * present, each call sends one event and flushes immediately (server functions
 * are short-lived), then shuts the client down.
 *
 * Never pass confidential report content (client names, evidence, findings)
 * into `properties` — keep events to ids and low-cardinality metadata, in line
 * with PenPad's data-handling posture.
 */
export async function captureServer(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  if (!token || !distinctId) return

  const client = new PostHog(token, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    flushAt: 1,
    flushInterval: 0,
  })

  try {
    client.capture({ distinctId, event, properties })
    await client.shutdown()
  } catch (err) {
    // Analytics must never break a user-facing flow.
    console.error('[analytics] server capture failed:', err)
  }
}
