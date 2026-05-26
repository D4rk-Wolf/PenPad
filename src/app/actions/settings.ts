'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminDb } from '@/lib/supabase/admin'
import { getStripeInstance } from '@/lib/stripe'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fullName = (formData.get('fullName') as string ?? '').trim().slice(0, 100)

  const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } })
  if (error) {
    console.error('[updateProfile]', error)
    redirect('/settings?error=profile')
  }
  redirect('/settings?success=profile#profile')
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string

  if (!newPassword || newPassword.length < 8) redirect('/settings?error=password-short#security')
  if (currentPassword === newPassword) redirect('/settings?error=password-same#security')

  // Verify current password before allowing the change
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })
  if (signInError) redirect('/settings?error=password-wrong#security')

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) {
    console.error('[updatePassword]', error)
    redirect('/settings?error=password#security')
  }
  redirect('/settings?success=security#security')
}

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const confirmation = (formData.get('confirmation') as string ?? '').toLowerCase().trim()
  if (confirmation !== 'delete my account') redirect('/settings?error=delete-confirm#danger')

  // Cancel active Stripe subscription before deleting data
  const { data: subRow } = await adminDb()
    .from('subscriptions')
    .select('stripe_subscription_id, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (subRow?.stripe_subscription_id && subRow.status === 'active') {
    try {
      await getStripeInstance().subscriptions.cancel(subRow.stripe_subscription_id)
    } catch (e) {
      console.error('[deleteAccount] Stripe cancel failed:', e)
    }
  }

  // Delete data in dependency order
  const { data: reportIds } = await adminDb()
    .from('reports')
    .select('id')
    .eq('user_id', user.id)

  if (reportIds?.length) {
    await adminDb()
      .from('findings')
      .delete()
      .in('report_id', reportIds.map(r => r.id))
  }

  await Promise.all([
    adminDb().from('finding_templates').delete().eq('user_id', user.id),
    adminDb().from('reports').delete().eq('user_id', user.id),
    adminDb().from('subscriptions').delete().eq('user_id', user.id),
  ])

  // Sign out first so cookies are cleared, then delete the auth record
  await supabase.auth.signOut()
  await adminDb().auth.admin.deleteUser(user.id)

  redirect('/')
}
