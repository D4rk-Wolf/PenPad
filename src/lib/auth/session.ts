import 'server-only'
import { cache } from 'react'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session?.user ?? null
})

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthenticated')
  return user
}
