// src/lib/stripe.ts
//
// NOTE: STRIPE_PRO_PRICE_ID must be set in .env.local after creating the
// "PenPad Pro" product (£49/mo recurring) in the Stripe dashboard.
// Copy the Price ID (starts with `price_`) into the env var.
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

export async function createCheckoutSession(userId: string, userEmail: string) {
  const session = await getStripe().checkout.sessions.create({
    customer_email: userEmail,
    line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    metadata: { userId },
  })
  return session
}

export async function createCustomerPortalSession(stripeCustomerId: string) {
  return getStripe().billingPortal.sessions.create({
    customer:   stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  })
}

export function getStripeInstance(): Stripe {
  return getStripe()
}
