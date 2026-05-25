// src/app/(app)/settings/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/app/actions/reports'
import { createCheckoutSession, createCustomerPortalSession } from '@/lib/stripe'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

async function startCheckout() {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const session = await createCheckoutSession(user.id, user.email!)
  redirect(session.url!)
}

async function openPortal() {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sub = await getSubscription(user.id)
  if (!sub?.stripeCustomerId) redirect('/settings')

  const portal = await createCustomerPortalSession(sub.stripeCustomerId)
  redirect(portal.url)
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const sub = await getSubscription(user!.id)
  const isPro = sub?.status === 'active'

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Card className="max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subscription</CardTitle>
            <Badge variant={isPro ? 'default' : 'secondary'}>{isPro ? 'Pro' : 'Free'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isPro ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Unlimited reports, PDF export. Renews on{' '}
                {sub?.currentPeriodEnd?.toLocaleDateString('en-GB')}.
              </p>
              <form action={openPortal}>
                <Button variant="outline" type="submit">Manage Subscription</Button>
              </form>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Free plan: 3 reports, no PDF export. Upgrade to Pro for unlimited reports and PDF export.
              </p>
              <form action={startCheckout}>
                <Button type="submit">Upgrade to Pro — £49/mo</Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
