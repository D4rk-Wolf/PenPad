// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getStripeInstance } from '@/lib/stripe'
import { adminDb } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

function getPeriodEnd(sub: Stripe.Subscription): string | null {
  const ts = sub.items?.data?.[0]?.current_period_end
  return typeof ts === 'number' ? new Date(ts * 1000).toISOString() : null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripeInstance().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        if (checkoutSession.mode !== 'subscription') break
        const userId = checkoutSession.metadata?.userId
        if (!userId) break

        // Verify the user actually exists in our auth system before granting Pro
        const { data: authUser, error: authErr } = await adminDb().auth.admin.getUserById(userId)
        if (authErr || !authUser?.user) {
          console.error('[stripe/webhook] userId from metadata not found in auth:', userId)
          break
        }

        const subscription = await getStripeInstance().subscriptions.retrieve(
          checkoutSession.subscription as string
        )

        await adminDb().from('subscriptions').upsert({
          user_id:               userId,
          stripe_customer_id:    checkoutSession.customer as string,
          stripe_subscription_id: subscription.id,
          status:                subscription.status,
          current_period_end:    getPeriodEnd(subscription),
        }, { onConflict: 'user_id' })
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await adminDb().from('subscriptions').update({
          status:             sub.status,
          current_period_end: getPeriodEnd(sub),
          updated_at:         new Date().toISOString(),
        }).eq('stripe_subscription_id', sub.id)
        break
      }
    }
  } catch (err) {
    console.error('[stripe/webhook] event processing error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
