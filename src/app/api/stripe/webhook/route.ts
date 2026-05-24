// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getStripeInstance } from '@/lib/stripe'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'

// In Stripe API 2026-04-22.dahlia, `current_period_end` lives on each
// subscription item rather than on the subscription itself. Use the first
// item's value as the subscription period end.
function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  const ts = sub.items?.data?.[0]?.current_period_end
  return typeof ts === 'number' ? new Date(ts * 1000) : null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = getStripeInstance().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const checkoutSession = event.data.object as Stripe.Checkout.Session
      if (checkoutSession.mode !== 'subscription') break
      const userId = checkoutSession.metadata?.userId
      if (!userId) break

      const subscription = await getStripeInstance().subscriptions.retrieve(
        checkoutSession.subscription as string
      )

      const periodEnd = getPeriodEnd(subscription)

      await db.insert(subscriptions).values({
        userId,
        stripeCustomerId:     checkoutSession.customer as string,
        stripeSubscriptionId: subscription.id,
        status:               subscription.status,
        currentPeriodEnd:     periodEnd,
      }).onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          stripeCustomerId:     checkoutSession.customer as string,
          stripeSubscriptionId: subscription.id,
          status:               subscription.status,
          currentPeriodEnd:     periodEnd,
          updatedAt:            new Date(),
        },
      })
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await db.update(subscriptions)
        .set({
          status:           sub.status,
          currentPeriodEnd: getPeriodEnd(sub),
          updatedAt:        new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id))
      break
    }
  }

  return NextResponse.json({ received: true })
}
