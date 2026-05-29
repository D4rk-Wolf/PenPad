'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { adminDb, camel } from '@/lib/supabase/admin'
import { getMySubscription } from '@/lib/subscriptions'
import type { UserBranding } from '@/lib/db/schema'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export async function getBranding(): Promise<UserBranding | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data, error } = await adminDb()
    .from('user_branding')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? camel<UserBranding>(data as Record<string, unknown>) : null
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

  const { error } = await adminDb()
    .from('user_branding')
    .upsert(
      { user_id: user.id, company_name: companyName, primary_color: primaryColor, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}
