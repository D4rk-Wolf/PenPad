'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { eq, inArray } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { adminDb } from '@/lib/supabase/admin'
import { db } from '@/lib/db'
import { reports, findings, findingTemplates, subscriptions, userBranding } from '@/lib/db/schema'
import { getStripeInstance } from '@/lib/stripe'
import { PasswordSchema } from '@/lib/validations'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fullName = z.string().max(100).default('').parse(
    (formData.get('fullName') as string ?? '').trim()
  )

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

  const parsed = PasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword:     formData.get('newPassword'),
  })
  if (!parsed.success) redirect('/settings?error=password-short#security')
  const { currentPassword, newPassword } = parsed.data

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

  // 1. Read subscription before any destructive operations
  const [subRow] = await db
    .select({
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      status:               subscriptions.status,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1)

  // 2. Cancel active Stripe subscription — fail-closed:
  //    abort the whole deletion if Stripe cancellation fails to avoid
  //    the user being charged after their account no longer exists.
  if (subRow?.stripeSubscriptionId && subRow.status === 'active') {
    try {
      await getStripeInstance().subscriptions.cancel(subRow.stripeSubscriptionId)
    } catch (e) {
      console.error('[deleteAccount] Stripe cancel failed — aborting deletion:', e)
      redirect('/settings?error=delete-billing#danger')
    }
  }

  // 3. Delete data in dependency order (findings first, then parent rows)
  const reportIds = await db
    .select({ id: reports.id })
    .from(reports)
    .where(eq(reports.userId, user.id))

  if (reportIds.length) {
    await db
      .delete(findings)
      .where(inArray(findings.reportId, reportIds.map(r => r.id)))
  }

  await Promise.all([
    db.delete(findingTemplates).where(eq(findingTemplates.userId, user.id)),
    db.delete(reports).where(eq(reports.userId, user.id)),
    db.delete(subscriptions).where(eq(subscriptions.userId, user.id)),
    db.delete(userBranding).where(eq(userBranding.userId, user.id)),
  ])

  // 4. Delete the auth record — invalidates all active sessions and tokens.
  //    Auth still lives in Supabase until Phase 2 (better-auth), so this
  //    remains a Supabase admin operation with no Drizzle equivalent.
  const { error: deleteErr } = await adminDb().auth.admin.deleteUser(user.id)
  if (deleteErr) {
    console.error('[deleteAccount] auth.admin.deleteUser failed:', deleteErr)
    redirect('/settings?error=delete-failed#danger')
  }

  // 5. Clear local session cookies after the auth record is gone
  await supabase.auth.signOut()

  redirect('/')
}
