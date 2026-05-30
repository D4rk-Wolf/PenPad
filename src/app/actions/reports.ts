'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminDb, camel } from '@/lib/supabase/admin'
import { ReportSchema } from '@/lib/validations'
import type { Report } from '@/lib/db/schema'
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
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => camel<Report>(r as Record<string, unknown>))
}

export async function createReport(formData: FormData) {
  const userId = await getCurrentUserId()

  // Use count query instead of fetching all row IDs (Perf H3)
  const [{ count: reportCount, error: e1 }, subResult] = await Promise.all([
    adminDb()
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    adminDb()
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .limit(1),
  ])
  if (e1) throw new Error(e1.message)

  const isPro = subResult.data?.[0]?.status === 'active'

  if (!isPro && (reportCount ?? 0) >= FREE_REPORT_LIMIT) {
    throw new Error(`Free tier limited to ${FREE_REPORT_LIMIT} reports. Upgrade to Pro for unlimited.`)
  }

  const parsed = ReportSchema.safeParse({
    clientName: formData.get('clientName'),
    scope:      formData.get('scope') || null,
    startDate:  formData.get('startDate') || null,
    endDate:    formData.get('endDate') || null,
    testerName: formData.get('testerName') || null,
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(i => i.message).join('; '))
  }
  const d = parsed.data

  const { data, error } = await adminDb()
    .from('reports')
    .insert({
      user_id:     userId,
      client_name: d.clientName,
      scope:       d.scope ?? null,
      start_date:  d.startDate ?? null,
      end_date:    d.endDate ?? null,
      tester_name: d.testerName ?? null,
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

  const parsed = ReportSchema.safeParse({
    clientName: formData.get('clientName'),
    scope:      formData.get('scope') || null,
    startDate:  formData.get('startDate') || null,
    endDate:    formData.get('endDate') || null,
    testerName: formData.get('testerName') || null,
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(i => i.message).join('; '))
  }
  const d = parsed.data

  const { error } = await adminDb()
    .from('reports')
    .update({
      client_name: d.clientName,
      scope:       d.scope ?? null,
      start_date:  d.startDate ?? null,
      end_date:    d.endDate ?? null,
      tester_name: d.testerName ?? null,
    })
    .eq('id', reportId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  revalidatePath(`/reports/${reportId}`)
  revalidatePath('/dashboard')
}

export async function updateReportStatus(
  reportId: string,
  status: 'draft' | 'active' | 'final',
) {
  const userId = await getCurrentUserId()

  if (!['draft', 'active', 'final'].includes(status)) {
    throw new Error('Invalid status')
  }

  const { error } = await adminDb()
    .from('reports')
    .update({ status })
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

