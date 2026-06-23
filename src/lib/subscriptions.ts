import 'server-only'
import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/session'
import { getLicenseStatus, isSelfHosted } from '@/lib/license'
import { db } from '@/lib/db'
import type { Subscription } from '@/lib/db/schema'
import { subscriptions } from '@/lib/db/schema'
import { authUser } from '@/lib/db/auth-schema'
import { isProFromTrial } from '@/lib/entitlement'

/**
 * Returns the subscription for the currently authenticated user.
 *
 * Wrapped in React `cache()` so multiple Server Components and Server Actions
 * within the same request share a single database round-trip instead of each
 * issuing their own query.
 *
 * On self-hosted deployments (`PENPAD_LICENSE_KEY` set) the subscription is
 * derived from the Keygen.sh license status rather than the database.
 *
 * On cloud, Pro is granted only by an active trial window (`trial_ends_at`).
 * A Stripe `subscriptions` row does NOT grant cloud Pro.
 */
export const getMySubscription = cache(async (): Promise<Subscription | null> => {
  if (isSelfHosted()) {
    const license = await getLicenseStatus()
    if (!license.valid) return null
    return {
      id: 'license',
      userId: 'license',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      status: license.tier === 'pro' ? 'active' : 'inactive',
      currentPeriodEnd: null,
      keygenLicenseId: null,
      licenseKey: null,
      updatedAt: new Date(),
    }
  }

  const user = await getCurrentUser()
  if (!user) return null

  const [row] = await db
    .select({ trialEndsAt: authUser.trialEndsAt })
    .from(authUser)
    .where(eq(authUser.id, user.id))
    .limit(1)

  const pro = isProFromTrial(row?.trialEndsAt ?? null)
  return {
    id: 'cloud',
    userId: user.id,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    status: pro ? 'active' : 'inactive',
    currentPeriodEnd: row?.trialEndsAt ?? null,
    keygenLicenseId: null,
    licenseKey: null,
    updatedAt: new Date(),
  }
})

export const getTrialEndsAt = cache(async (): Promise<Date | null> => {
  if (isSelfHosted()) return null
  const user = await getCurrentUser()
  if (!user) return null
  const [row] = await db
    .select({ trialEndsAt: authUser.trialEndsAt })
    .from(authUser).where(eq(authUser.id, user.id)).limit(1)
  return row?.trialEndsAt ?? null
})

export const getCloudLicense = cache(async (): Promise<{ licenseKey: string | null }> => {
  if (isSelfHosted()) return { licenseKey: null }
  const user = await getCurrentUser()
  if (!user) return { licenseKey: null }
  const [row] = await db
    .select({ licenseKey: subscriptions.licenseKey })
    .from(subscriptions).where(eq(subscriptions.userId, user.id)).limit(1)
  return { licenseKey: row?.licenseKey ?? null }
})
