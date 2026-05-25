'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminDb(), camel } from '@/lib/supabase/admin'
import type { Report, Subscription } from '@/lib/db/schema'
import { FREE_REPORT_LIMIT } from '@/lib/utils'

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  return user.id
}

export async function getReports(): Promise<Report[]> {
  const userId = await getCurrentUserId()
  const { data, error } = await adminDb()
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => camel<Report>(r as Record<string, unknown>))
}

export async function createReport(formData: FormData) {
  const userId = await getCurrentUserId()

  const { data: existing, error: e1 } = await adminDb()
    .from('reports')
    .select('id')
    .eq('user_id', userId)
  if (e1) throw new Error(e1.message)

  const { data: subRows, error: e2 } = await adminDb()
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .limit(1)
  if (e2) throw new Error(e2.message)

  const isPro = subRows?.[0]?.status === 'active'

  if (!isPro && (existing?.length ?? 0) >= FREE_REPORT_LIMIT) {
    throw new Error(`Free tier limited to ${FREE_REPORT_LIMIT} reports. Upgrade to Pro for unlimited.`)
  }

  const { data, error } = await adminDb()
    .from('reports')
    .insert({
      user_id:     userId,
      client_name: formData.get('clientName') as string,
      scope:       formData.get('scope') as string || null,
      start_date:  formData.get('startDate') as string || null,
      end_date:    formData.get('endDate') as string || null,
      tester_name: formData.get('testerName') as string || null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  const report = camel<Report>(data as Record<string, unknown>)

  revalidatePath('/dashboard')
  redirect(`/reports/${report.id}`)
}

export async function updateReport(reportId: string, formData: FormData) {
  const userId = await getCurrentUserId()
  const { error } = await adminDb()
    .from('reports')
    .update({
      client_name: formData.get('clientName') as string,
      scope:       formData.get('scope') as string || null,
      start_date:  formData.get('startDate') as string || null,
      end_date:    formData.get('endDate') as string || null,
      tester_name: formData.get('testerName') as string || null,
    })
    .eq('id', reportId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  revalidatePath(`/reports/${reportId}`)
  revalidatePath('/dashboard')
}

export async function deleteReport(reportId: string) {
  const userId = await getCurrentUserId()
  const { error } = await adminDb()
    .from('reports')
    .delete()
    .eq('id', reportId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function getSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await adminDb()
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? camel<Subscription>(data as Record<string, unknown>) : null
}
