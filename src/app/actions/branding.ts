'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { userBranding } from '@/lib/db/schema'
import { getMySubscription } from '@/lib/subscriptions'
import type { UserBranding } from '@/lib/db/schema'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export async function getBranding(): Promise<UserBranding | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const rows = await db
    .select()
    .from(userBranding)
    .where(eq(userBranding.userId, user.id))
    .limit(1)
  return rows[0] ?? null
}

export async function updateBranding(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const sub = await getMySubscription()
  if (sub?.status !== 'active') throw new Error('Pro subscription required')

  const companyName  = (formData.get('companyName')  as string | null)?.trim().slice(0, 100) || null
  const primaryColor = (formData.get('primaryColor') as string | null)?.trim() || null

  if (primaryColor && !HEX_RE.test(primaryColor)) {
    throw new Error('Brand colour must be a valid hex value (e.g. #1d4ed8)')
  }

  await db
    .insert(userBranding)
    .values({
      userId:       user.id,
      companyName,
      primaryColor,
      updatedAt:    new Date(),
    })
    .onConflictDoUpdate({
      target: userBranding.userId,
      set: { companyName, primaryColor, updatedAt: new Date() },
    })

  revalidatePath('/settings')
}
