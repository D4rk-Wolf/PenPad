'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { findings, reports } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { deriveSeverity } from '@/lib/utils'

async function assertReportOwner(reportId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const [report] = await db.select().from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.userId, user.id)))
  if (!report) throw new Error('Report not found')
  return user.id
}

export async function getFindings(reportId: string) {
  await assertReportOwner(reportId)
  return db.select().from(findings)
    .where(eq(findings.reportId, reportId))
    .orderBy(findings.sortOrder, findings.createdAt)
}

export async function createFinding(reportId: string, formData: FormData) {
  await assertReportOwner(reportId)
  const cvssScore = parseFloat(formData.get('cvssScore') as string) || 0

  await db.insert(findings).values({
    reportId,
    title:          formData.get('title') as string,
    description:    formData.get('description') as string || null,
    cvssScore:      cvssScore.toFixed(1),
    severity:       deriveSeverity(cvssScore),
    impact:         formData.get('impact') as string || null,
    recommendation: formData.get('recommendation') as string || null,
    evidence:       formData.get('evidence') as string || null,
  })

  revalidatePath(`/reports/${reportId}`)
}

export async function updateFinding(findingId: string, reportId: string, formData: FormData) {
  await assertReportOwner(reportId)
  const cvssScore = parseFloat(formData.get('cvssScore') as string) || 0

  await db.update(findings)
    .set({
      title:          formData.get('title') as string,
      description:    formData.get('description') as string || null,
      cvssScore:      cvssScore.toFixed(1),
      severity:       deriveSeverity(cvssScore),
      impact:         formData.get('impact') as string || null,
      recommendation: formData.get('recommendation') as string || null,
      evidence:       formData.get('evidence') as string || null,
    })
    .where(eq(findings.id, findingId))

  revalidatePath(`/reports/${reportId}`)
}

export async function deleteFinding(findingId: string, reportId: string) {
  await assertReportOwner(reportId)
  await db.delete(findings).where(eq(findings.id, findingId))
  revalidatePath(`/reports/${reportId}`)
}
