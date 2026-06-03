import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getCurrentUser } from '@/lib/auth/session'
import { auth } from '@/lib/auth'
import { AppShell } from '@/components/layout/app-shell'
import { SentryReplayActivator } from '@/components/sentry-replay-activator'
import { UpdateBanner } from '@/components/layout/update-banner'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  async function signOut() {
    'use server'
    await auth.api.signOut({ headers: await headers() })
    redirect('/login')
  }

  return (
    <AppShell
      user={{ email: user.email, name: user.name ?? undefined }}
      signOut={signOut}
    >
      <SentryReplayActivator />
      <UpdateBanner />
      {children}
    </AppShell>
  )
}
