// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getStripeInstance } from '@/lib/stripe'
import { adminDb } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

function getPeriodEnd(sub: Stripe.Subscription): string | null {
  const ts = sub.items?.data?.[0]?.current_period_end
  return typeof ts === 'number' ? new Date(ts * 1000).toISOString() : null
}

/** Resolve subscription ID from an invoice (may be string or expanded object).
 *  The `subscription` field typing varies by API version; cast through unknown. */
function getSubIdFromInvoice(invoice: Stripe.Invoice): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = (invoice as any).subscription
  if (!sub) return null
  return typeof sub === 'string' ? sub : (sub as { id: string }).id
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripeInstance().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── Idempotency check ─────────────────────────────────────────────────────
  // Stripe guarantees at-least-once delivery; we deduplicate by event ID.
  // Check first; insert after successful processing so failed events can retry.
  const { data: alreadyProcessed } = await adminDb()
    .from('stripe_events_processed')
    .select('event_id')
    .eq('event_id', event.id)
    .maybeSingle()

  if (alreadyProcessed) {
    return NextResponse.json({ received: true })
  }

  // ── Event dispatch ─────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        if (checkoutSession.mode !== 'subscription') break
        const userId = checkoutSession.metadata?.userId
        if (!userId) break

        // Verify user exists before granting Pro access
        const { data: authUser, error: authErr } = await adminDb().auth.admin.getUserById(userId)
        if (authErr || !authUser?.user) {
          console.error('[stripe/webhook] userId not found in auth:', userId)
          break
        }

        // Cross-check: the Stripe customer email must match the auth user email.
        // Prevents a tampered/replayed checkout metadata from granting Pro to a
        // different account.
        const stripeCustomerId = checkoutSession.customer as string
        const stripeCustomer = await getStripeInstance().customers.retrieve(stripeCustomerId)
        if (stripeCustomer.deleted) {
          console.error('[stripe/webhook] Stripe customer deleted:', stripeCustomerId)
          break
        }
        if (stripeCustomer.email && authUser.user.email &&
            stripeCustomer.email.toLowerCase() !== authUser.user.email.toLowerCase()) {
          console.error(
            '[stripe/webhook] customer email mismatch — Stripe:', stripeCustomer.email,
            '— auth:', authUser.user.email,
          )
          break
        }

        const subscription = await getStripeInstance().subscriptions.retrieve(
          checkoutSession.subscription as string,
        )

        await adminDb()
          .from('subscriptions')
          .upsert(
            {
              user_id:                userId,
              stripe_customer_id:     checkoutSession.customer as string,
              stripe_subscription_id: subscription.id,
              status:                 subscription.status,
              current_period_end:     getPeriodEnd(subscription),
            },
            { onConflict: 'user_id' },
          )
          .throwOnError()
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const sub = event.data.object as Stripe.Subscription
        await adminDb()
          .from('subscriptions')
          .update({
            status:             sub.status,
            current_period_end: getPeriodEnd(sub),
            updated_at:         new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)
          .throwOnError()
        break
      }

      case 'invoice.payment_failed': {
        // Stripe will also emit customer.subscription.updated (status→past_due/unpaid)
        // but we proactively sync here so our DB is never stale between the two events.
        const invoice = event.data.object as Stripe.Invoice
        const subId = getSubIdFromInvoice(invoice)
        if (!subId) break

        const freshSub = await getStripeInstance().subscriptions.retrieve(subId)
        await adminDb()
          .from('subscriptions')
          .update({
            status:             freshSub.status,
            current_period_end: getPeriodEnd(freshSub),
            updated_at:         new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subId)
          .throwOnError()

        console.warn(
          '[stripe/webhook] invoice.payment_failed — subscription:', subId,
          '— new status:', freshSub.status,
        )
        break
      }
    }
  } catch (err) {
    console.error('[stripe/webhook] event processing error:', err)
    // Do NOT mark as processed — allow Stripe to retry
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  // ── Mark event as processed ───────────────────────────────────────────────
  // Inserted after success; if we returned 500 above this is never reached,
  // allowing Stripe's retry to re-process the event.
  const { error: dedupErr } = await adminDb()
    .from('stripe_events_processed')
    .insert({ event_id: event.id })

  if (dedupErr) {
    // Duplicate key = concurrent delivery race; safe to ignore
    if (dedupErr.code !== '23505') {
      console.error('[stripe/webhook] dedup insert failed:', dedupErr)
    }
  }

  return NextResponse.json({ received: true })
}
