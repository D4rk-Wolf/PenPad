import 'server-only'

/** Cloud Pro is granted only by an active trial window. */
export function isProFromTrial(trialEndsAt: Date | null | undefined): boolean {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt).getTime() > Date.now()
}
