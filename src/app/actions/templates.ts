'use server'

import { revalidatePath } from 'next/cache'
import { eq, desc, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { findings, findingTemplates, reports } from '@/lib/db/schema'
import { getMySubscription } from '@/lib/subscriptions'
import type { FindingTemplate } from '@/lib/db/schema'

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  return user
}

export async function getMyTemplates(): Promise<FindingTemplate[]> {
  const user = await getCurrentUser()
  return db
    .select()
    .from(findingTemplates)
    .where(eq(findingTemplates.userId, user.id))
    .orderBy(desc(findingTemplates.createdAt))
}

export async function saveTemplate(findingId: string) {
  const user = await getCurrentUser()

  const sub = await getMySubscription()
  if (sub?.status !== 'active') throw new Error('Pro subscription required')

  const [finding] = await db
    .select({
      id:             findings.id,
      title:          findings.title,
      description:    findings.description,
      cvssScore:      findings.cvssScore,
      severity:       findings.severity,
      impact:         findings.impact,
      recommendation: findings.recommendation,
      evidence:       findings.evidence,
      reportUserId:   reports.userId,
    })
    .from(findings)
    .innerJoin(reports, eq(findings.reportId, reports.id))
    .where(eq(findings.id, findingId))
    .limit(1)

  if (!finding || finding.reportUserId !== user.id)
    throw new Error('Finding not found or access denied')

  await db.insert(findingTemplates).values({
    userId:         user.id,
    title:          finding.title,
    description:    finding.description,
    cvssScore:      finding.cvssScore,
    severity:       finding.severity,
    impact:         finding.impact,
    recommendation: finding.recommendation,
    evidence:       finding.evidence,
  })
  revalidatePath('/templates')
}

export async function deleteTemplate(templateId: string) {
  const user = await getCurrentUser()
  const deleted = await db
    .delete(findingTemplates)
    .where(and(eq(findingTemplates.id, templateId), eq(findingTemplates.userId, user.id)))
    .returning({ id: findingTemplates.id })
  if (deleted.length === 0) throw new Error('Template not found or access denied')
  revalidatePath('/templates')
}
