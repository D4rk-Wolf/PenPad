import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { adminDb, camel } from '@/lib/supabase/admin'
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

  const { data, error } = await adminDb()
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? camel<Subscription>(data as Record<string, unknown>) : null
})
