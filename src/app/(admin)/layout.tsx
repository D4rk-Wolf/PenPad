import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { SentryReplayActivator } from '@/components/sentry-replay-activator'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) notFound()

  return (
    <AppShell
      user={{
        email: user.email ?? '',
        name: user.user_metadata?.full_name as string | undefined,
      }}
      signOut={signOut}
    >
      <SentryReplayActivator />
      {children}
    </AppShell>
  )
}
