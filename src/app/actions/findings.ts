'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { adminDb, camel } from '@/lib/supabase/admin'
import type { Finding } from '@/lib/db/schema'
import { deriveSeverity } from '@/lib/utils'

async function assertReportOwner(reportId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { data } = await adminDb()
    .from('reports')
    .select('id')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!data) throw new Error('Report not found')
  return user.id
}

export async function getFindings(reportId: string): Promise<Finding[]> {
  await assertReportOwner(reportId)
  const { data, error } = await adminDb()
    .from('findings')
    .select('*')
    .eq('report_id', reportId)
    .order('sort_order')
    .order('created_at')
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => camel<Finding>(r as Record<string, unknown>))
}

export async function createFinding(reportId: string, formData: FormData) {
  await assertReportOwner(reportId)
  const cvssScore = parseFloat(formData.get('cvssScore') as string) || 0

  const { error } = await adminDb().from('findings').insert({
    report_id:      reportId,
    title:          formData.get('title') as string,
    description:    formData.get('description') as string || null,
    cvss_score:     parseFloat(cvssScore.toFixed(1)),
    severity:       deriveSeverity(cvssScore),
    impact:         formData.get('impact') as string || null,
    recommendation: formData.get('recommendation') as string || null,
    evidence:       formData.get('evidence') as string || null,
    affected_component: formData.get('affectedComponent') as string || null,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/reports/${reportId}`)
}

export async function updateFinding(findingId: string, reportId: string, formData: FormData) {
  await assertReportOwner(reportId)
  const cvssScore = parseFloat(formData.get('cvssScore') as string) || 0

  const { error } = await adminDb()
    .from('findings')
    .update({
      title:          formData.get('title') as string,
      description:    formData.get('description') as string || null,
      cvss_score:     parseFloat(cvssScore.toFixed(1)),
      severity:       deriveSeverity(cvssScore),
      impact:         formData.get('impact') as string || null,
      recommendation: formData.get('recommendation') as string || null,
      evidence:       formData.get('evidence') as string || null,
      affected_component: formData.get('affectedComponent') as string || null,
    })
    .eq('id', findingId)
    .eq('report_id', reportId)
  if (error) throw new Error(error.message)
  revalidatePath(`/reports/${reportId}`)
}

export async function deleteFinding(findingId: string, reportId: string) {
  await assertReportOwner(reportId)
  const { error } = await adminDb().from('findings').delete().eq('id', findingId).eq('report_id', reportId)
  if (error) throw new Error(error.message)
  revalidatePath(`/reports/${reportId}`)
}
