import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getStripeInstance } from '@/lib/stripe'
import { db } from '@/lib/db'
import { subscriptions, stripeEventsProcessed } from '@/lib/db/schema'
import { authUser as authUserTable } from '@/lib/db/auth-schema'
import type Stripe from 'stripe'
import { captureServer } from '@/lib/analytics/server'
import { createProLicense, suspendLicense, reinstateLicense } from '@/lib/keygen'
import { sendLicenseEmail } from '@/lib/email/license'

function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  const ts = sub.items?.data?.[0]?.current_period_end
  return typeof ts === 'number' ? new Date(ts * 1000) : null
}

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
  const [alreadyProcessed] = await db
    .select({ eventId: stripeEventsProcessed.eventId })
    .from(stripeEventsProcessed)
    .where(eq(stripeEventsProcessed.eventId, event.id))
    .limit(1)

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

        const [foundUser] = await db
          .select({ id: authUserTable.id, email: authUserTable.email })
          .from(authUserTable)
          .where(eq(authUserTable.id, userId))
          .limit(1)

        if (!foundUser) {
          console.error('[stripe/webhook] userId not found in auth:', userId)
          break
        }

        const stripeCustomerId = checkoutSession.customer as string
        const stripeCustomer = await getStripeInstance().customers.retrieve(stripeCustomerId)
        if (stripeCustomer.deleted) {
          console.error('[stripe/webhook] Stripe customer deleted:', stripeCustomerId)
          break
        }
        if (stripeCustomer.email && foundUser.email &&
            stripeCustomer.email.toLowerCase() !== foundUser.email.toLowerCase()) {
          console.error(
            '[stripe/webhook] customer email mismatch — Stripe:', stripeCustomer.email,
            '— auth:', foundUser.email,
          )
          break
        }

        const subscription = await getStripeInstance().subscriptions.retrieve(
          checkoutSession.subscription as string,
        )

        await db
          .insert(subscriptions)
          .values({
            userId,
            stripeCustomerId,
            stripeSubscriptionId: subscription.id,
            status:               subscription.status,
            currentPeriodEnd:     getPeriodEnd(subscription),
          })
          .onConflictDoUpdate({
            target: subscriptions.userId,
            set: {
              stripeCustomerId,
              stripeSubscriptionId: subscription.id,
              status:               subscription.status,
              currentPeriodEnd:     getPeriodEnd(subscription),
              updatedAt:            new Date(),
            },
          })

        await captureServer(userId, 'subscription_started', {
          plan: 'pro',
          status: subscription.status,
        })

        // Provision a self-hosted Keygen license (paid = self-hosted).
        const [existingLic] = await db
          .select({ keygenLicenseId: subscriptions.keygenLicenseId })
          .from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1)
        if (!existingLic?.keygenLicenseId) {
          const license = await createProLicense({ email: foundUser.email ?? '', stripeCustomerId, userId })
          if (license) {
            await db.update(subscriptions)
              .set({ keygenLicenseId: license.licenseId, licenseKey: license.licenseKey, updatedAt: new Date() })
              .where(eq(subscriptions.userId, userId))
            if (foundUser.email) await sendLicenseEmail(foundUser.email, license.licenseKey)
          }
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const sub = event.data.object as Stripe.Subscription
        await db
          .update(subscriptions)
          .set({
            status:          sub.status,
            currentPeriodEnd: getPeriodEnd(sub),
            updatedAt:       new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, sub.id))

        // Sync Keygen license state.
        const [subRow] = await db
          .select({ keygenLicenseId: subscriptions.keygenLicenseId })
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, sub.id))
          .limit(1)
        if (subRow?.keygenLicenseId) {
          if (event.type === 'customer.subscription.updated' && sub.status === 'active') {
            await reinstateLicense(subRow.keygenLicenseId)
          } else if (
            event.type === 'customer.subscription.deleted' ||
            event.type === 'customer.subscription.paused' ||
            (event.type === 'customer.subscription.updated' && sub.status !== 'active')
          ) {
            await suspendLicense(subRow.keygenLicenseId)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = getSubIdFromInvoice(invoice)
        if (!subId) break

        const freshSub = await getStripeInstance().subscriptions.retrieve(subId)
        await db
          .update(subscriptions)
          .set({
            status:           freshSub.status,
            currentPeriodEnd: getPeriodEnd(freshSub),
            updatedAt:        new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subId))

        console.warn(
          '[stripe/webhook] invoice.payment_failed — subscription:', subId,
          '— new status:', freshSub.status,
        )

        // Suspend Keygen license if payment failed and subscription is no longer active.
        if (freshSub.status !== 'active') {
          const [failedSubRow] = await db
            .select({ keygenLicenseId: subscriptions.keygenLicenseId })
            .from(subscriptions)
            .where(eq(subscriptions.stripeSubscriptionId, subId))
            .limit(1)
          if (failedSubRow?.keygenLicenseId) {
            await suspendLicense(failedSubRow.keygenLicenseId)
          }
        }
        break
      }
    }
  } catch (err) {
    console.error('[stripe/webhook] event processing error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  // ── Mark event as processed ───────────────────────────────────────────────
  try {
    await db
      .insert(stripeEventsProcessed)
      .values({ eventId: event.id })
      .onConflictDoNothing()
  } catch (err) {
    console.error('[stripe/webhook] dedup insert failed:', err)
  }

  return NextResponse.json({ received: true })
}
