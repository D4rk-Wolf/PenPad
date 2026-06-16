import 'server-only'
import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/session'
import { getLicenseStatus, isSelfHosted } from '@/lib/license'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import type { Subscription } from '@/lib/db/schema'

/**
 * Returns the subscription for the currently authenticated user.
 *
 * Wrapped in React `cache()` so multiple Server Components and Server Actions
 * within the same request share a single database round-trip instead of each
 * issuing their own query.
 *
 * On self-hosted deployments (`PENPAD_LICENSE_KEY` set) the subscription is
 * derived from the Keygen.sh license status rather than the database.
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

  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1)
  return rows[0] ?? null
})
