'use server'

import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth/session'
import { createCheckoutSession } from '@/lib/stripe'

/**
 * Starts a Stripe Checkout session for the Pro plan and redirects to it.
 * Shared by the Settings billing form and the in-context upgrade modal so
 * there is a single, audited checkout entry point.
 */
export async function startProCheckout() {
  const user = await requireUser()
  const session = await createCheckoutSession(user.id, user.email)
  redirect(session.url!)
}
