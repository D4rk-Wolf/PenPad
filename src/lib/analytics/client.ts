import posthog from 'posthog-js'

/**
 * Client-side PostHog capture, guarded so it is a safe no-op when PostHog was
 * not initialized (no token configured, or SSR). Import only from client
 * components. PostHog is initialized in `src/instrumentation-client.ts`.
 */
export function captureClient(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return
  posthog.capture(event, properties)
}
