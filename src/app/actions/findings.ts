'use server'

import { revalidatePath } from 'next/cache'
import { eq, asc, and, count } from 'drizzle-orm'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { reports, findings } from '@/lib/db/schema'
import { getMySubscription } from '@/lib/subscriptions'
import { FindingSchema } from '@/lib/validations'
import type { Finding } from '@/lib/db/schema'
import { deriveSeverity, FREE_FINDING_LIMIT } from '@/lib/utils'

async function assertReportOwner(reportId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const [report] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.userId, user.id)))
    .limit(1)
  if (!report) throw new Error('Report not found')
  return user.id
}

export async function getFindings(reportId: string): Promise<Finding[]> {
  await assertReportOwner(reportId)
  return db
    .select()
    .from(findings)
    .where(eq(findings.reportId, reportId))
    .orderBy(asc(findings.sortOrder), asc(findings.createdAt))
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
  if (!parsed.success) throw new Error(parsed.error.issues.map(i => i.message).join('; '))
  const d = parsed.data

  const [sub, countResult] = await Promise.all([
    getMySubscription(),
    db.select({ value: count() }).from(findings).where(eq(findings.reportId, reportId)),
  ])
  const isPro = sub?.status === 'active'
  if (!isPro && (countResult[0]?.value ?? 0) >= FREE_FINDING_LIMIT) {
    throw new Error(`Free tier limited to ${FREE_FINDING_LIMIT} findings per report. Upgrade to Pro for unlimited.`)
  }

  const cvssScore = d.cvssScore.toFixed(1)
  await db.insert(findings).values({
    reportId,
    title:             d.title,
    description:       d.description ?? null,
    cvssScore,
    severity:          deriveSeverity(parseFloat(cvssScore)),
    impact:            d.impact ?? null,
    recommendation:    d.recommendation ?? null,
    evidence:          d.evidence ?? null,
    affectedComponent: d.affectedComponent ?? null,
  })
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
  if (!parsed.success) throw new Error(parsed.error.issues.map(i => i.message).join('; '))
  const d = parsed.data

  const cvssScore = d.cvssScore.toFixed(1)
  await db
    .update(findings)
    .set({
      title:             d.title,
      description:       d.description ?? null,
      cvssScore,
      severity:          deriveSeverity(parseFloat(cvssScore)),
      impact:            d.impact ?? null,
      recommendation:    d.recommendation ?? null,
      evidence:          d.evidence ?? null,
      affectedComponent: d.affectedComponent ?? null,
    })
    .where(and(eq(findings.id, findingId), eq(findings.reportId, reportId)))
  revalidatePath(`/reports/${reportId}`)
}

export async function deleteFinding(findingId: string, reportId: string) {
  await assertReportOwner(reportId)

  const uuidSchema = z.string().uuid()
  uuidSchema.parse(findingId)
  uuidSchema.parse(reportId)

  await db
    .delete(findings)
    .where(and(eq(findings.id, findingId), eq(findings.reportId, reportId)))
  revalidatePath(`/reports/${reportId}`)
}
