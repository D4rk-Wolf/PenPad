import 'server-only'
import { cache } from 'react'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import type { Subscription } from '@/lib/db/schema'

/**
 * Returns the subscription for the currently authenticated user.
 *
 * Wrapped in React `cache()` so multiple Server Components and Server Actions
 * within the same request share a single database round-trip instead of each
 * issuing their own query.
 */
export const getMySubscription = cache(async (): Promise<Subscription | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1)
  return rows[0] ?? null
})
