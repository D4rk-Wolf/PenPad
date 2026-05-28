'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { adminDb, camel } from '@/lib/supabase/admin'
import { getMySubscription } from '@/lib/subscriptions'
import { FindingSchema } from '@/lib/validations'
import type { Finding } from '@/lib/db/schema'
import { deriveSeverity, FREE_FINDING_LIMIT } from '@/lib/utils'

// ── Auth guard ────────────────────────────────────────────────────────────────

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

// ── Actions ───────────────────────────────────────────────────────────────────

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

  const parsed = FindingSchema.safeParse({
    title:             formData.get('title'),
    description:       formData.get('description') || null,
    cvssScore:         formData.get('cvssScore') ?? '0',
    impact:            formData.get('impact') || null,
    recommendation:    formData.get('recommendation') || null,
    evidence:          formData.get('evidence') || null,
    affectedComponent: formData.get('affectedComponent') || null,
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(i => i.message).join('; '))
  }
  const d = parsed.data

  // Enforce free-tier finding limit
  const [sub, { count: findingCount }] = await Promise.all([
    getMySubscription(),
    adminDb().from('findings').select('*', { count: 'exact', head: true }).eq('report_id', reportId),
  ])
  const isPro = sub?.status === 'active'
  if (!isPro && (findingCount ?? 0) >= FREE_FINDING_LIMIT) {
    throw new Error(`Free tier limited to ${FREE_FINDING_LIMIT} findings per report. Upgrade to Pro for unlimited.`)
  }

  const cvssScore = parseFloat(d.cvssScore.toFixed(1))
  const { error } = await adminDb().from('findings').insert({
    report_id:          reportId,
    title:              d.title,
    description:        d.description ?? null,
    cvss_score:         cvssScore,
    severity:           deriveSeverity(cvssScore),
    impact:             d.impact ?? null,
    recommendation:     d.recommendation ?? null,
    evidence:           d.evidence ?? null,
    affected_component: d.affectedComponent ?? null,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/reports/${reportId}`)
}

export async function updateFinding(findingId: string, reportId: string, formData: FormData) {
  await assertReportOwner(reportId)

  const parsed = FindingSchema.safeParse({
    title:             formData.get('title'),
    description:       formData.get('description') || null,
    cvssScore:         formData.get('cvssScore') ?? '0',
    impact:            formData.get('impact') || null,
    recommendation:    formData.get('recommendation') || null,
    evidence:          formData.get('evidence') || null,
    affectedComponent: formData.get('affectedComponent') || null,
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map(i => i.message).join('; '))
  }
  const d = parsed.data

  const cvssScore = parseFloat(d.cvssScore.toFixed(1))
  const { error } = await adminDb()
    .from('findings')
    .update({
      title:              d.title,
      description:        d.description ?? null,
      cvss_score:         cvssScore,
      severity:           deriveSeverity(cvssScore),
      impact:             d.impact ?? null,
      recommendation:     d.recommendation ?? null,
      evidence:           d.evidence ?? null,
      affected_component: d.affectedComponent ?? null,
    })
    .eq('id', findingId)
    .eq('report_id', reportId)
  if (error) throw new Error(error.message)
  revalidatePath(`/reports/${reportId}`)
}

export async function deleteFinding(findingId: string, reportId: string) {
  await assertReportOwner(reportId)

  // Validate UUIDs to prevent injection via path params
  const uuidSchema = z.string().uuid()
  uuidSchema.parse(findingId)
  uuidSchema.parse(reportId)

  const { error } = await adminDb().from('findings').delete().eq('id', findingId).eq('report_id', reportId)
  if (error) throw new Error(error.message)
  revalidatePath(`/reports/${reportId}`)
}
