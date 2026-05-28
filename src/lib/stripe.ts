// src/lib/stripe.ts
//
// NOTE: STRIPE_PRO_PRICE_ID must be set in .env.local after creating the
// "PenPad Pro" product (£49/mo recurring) in the Stripe dashboard.
// Copy the Price ID (starts with `price_`) into the env var.
import 'server-only'
import Stripe from 'stripe'

let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    })
  }
  return _stripe
}

/**
 * Asserts that a URL returned by Stripe actually points to an allowed host.
 * Guards against unexpected redirects if the Stripe response were ever tampered
 * with or if a misconfiguration introduced a wrong URL.
 */
function assertStripeRedirectUrl(url: string | null | undefined, label: string): string {
  if (!url) throw new Error(`Stripe returned no ${label} URL`)
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`Stripe ${label} URL is not a valid URL: ${url}`)
  }
  const allowed = ['checkout.stripe.com', 'billing.stripe.com', 'stripe.com']
  if (!allowed.some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host))) {
    throw new Error(`Unexpected Stripe ${label} redirect origin: ${parsed.hostname}`)
  }
  return url
}

/**
 * Validates NEXT_PUBLIC_APP_URL and returns a safe absolute URL for a path.
 * Prevents open-redirect if the env var is ever misconfigured.
 */
function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL
  if (!base) throw new Error('NEXT_PUBLIC_APP_URL is not set')
  // Validate it's a proper URL before using it in Stripe session params
  try {
    const parsed = new URL(base)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('NEXT_PUBLIC_APP_URL must use http or https')
    }
    return `${parsed.origin}${path}`
  } catch {
    throw new Error(`NEXT_PUBLIC_APP_URL is not a valid URL: ${base}`)
  }
}

export async function createCheckoutSession(userId: string, userEmail: string) {
  const session = await getStripe().checkout.sessions.create({
    customer_email: userEmail,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    mode: 'subscription',
    success_url: appUrl('/dashboard?upgraded=true'),
    cancel_url:  appUrl('/settings'),
    metadata: { userId },
  })
  // Assert the returned checkout URL is on stripe.com before we redirect to it
  assertStripeRedirectUrl(session.url, 'checkout')
  return session
}

export async function createCustomerPortalSession(stripeCustomerId: string) {
  const session = await getStripe().billingPortal.sessions.create({
    customer:   stripeCustomerId,
    return_url: appUrl('/settings'),
  })
  // Assert the returned portal URL is on stripe.com before we redirect to it
  assertStripeRedirectUrl(session.url, 'portal')
  return session
}

export function getStripeInstance(): Stripe {
  return getStripe()
}
