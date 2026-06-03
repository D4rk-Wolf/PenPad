import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { getCurrentUser } from '@/lib/auth/session'
import { auth } from '@/lib/auth'
import { AppShell } from '@/components/layout/app-shell'
import { SentryReplayActivator } from '@/components/sentry-replay-activator'

async function signOut() {
  'use server'
  await auth.api.signOut({ headers: await headers() })
  redirect('/login')
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) notFound()

  return (
    <AppShell
      user={{
        email: user.email,
        name: user.name ?? undefined,
      }}
      signOut={signOut}
    >
      <SentryReplayActivator />
      {children}
    </AppShell>
  )
}
