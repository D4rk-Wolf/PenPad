'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, desc, count, and } from 'drizzle-orm'
import { requireUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { reports, subscriptions } from '@/lib/db/schema'
import { ReportSchema } from '@/lib/validations'
import type { Report } from '@/lib/db/schema'
import { FREE_REPORT_LIMIT } from '@/lib/utils'
import { captureServer } from '@/lib/analytics/server'

async function getCurrentUserId(): Promise<string> {
  const user = await requireUser()
  return user.id
}

export async function getReports(): Promise<Report[]> {
  const userId = await getCurrentUserId()
  return db
    .select()
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt))
    .limit(100)
}

export async function createReport(formData: FormData) {
  const userId = await getCurrentUserId()

  const [countResult, subResult] = await Promise.all([
    db.select({ value: count() }).from(reports).where(eq(reports.userId, userId)),
    db.select({ status: subscriptions.status }).from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1),
  ])
  const isPro = subResult[0]?.status === 'active'
  if (!isPro && (countResult[0]?.value ?? 0) >= FREE_REPORT_LIMIT) {
    throw new Error(`Free tier limited to ${FREE_REPORT_LIMIT} reports. Upgrade to Pro for unlimited.`)
  }

  const parsed = ReportSchema.safeParse({
    clientName: formData.get('clientName'),
    scope:      formData.get('scope') || null,
    startDate:  formData.get('startDate') || null,
    endDate:    formData.get('endDate') || null,
    testerName: formData.get('testerName') || null,
  })
  if (!parsed.success) throw new Error(parsed.error.issues.map(i => i.message).join('; '))
  const d = parsed.data

  const [report] = await db
    .insert(reports)
    .values({
      userId,
      clientName: d.clientName,
      scope:      d.scope ?? null,
      startDate:  d.startDate ?? null,
      endDate:    d.endDate ?? null,
      testerName: d.testerName ?? null,
    })
    .returning()

  await captureServer(userId, 'report_created', { report_id: report.id })

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
  if (!parsed.success) throw new Error(parsed.error.issues.map(i => i.message).join('; '))
  const d = parsed.data

  await db
    .update(reports)
    .set({
      clientName: d.clientName,
      scope:      d.scope ?? null,
      startDate:  d.startDate ?? null,
      endDate:    d.endDate ?? null,
      testerName: d.testerName ?? null,
    })
    .where(and(eq(reports.id, reportId), eq(reports.userId, userId)))

  revalidatePath(`/reports/${reportId}`)
  revalidatePath('/dashboard')
}

export async function updateReportStatus(reportId: string, status: string) {
  const userId = await getCurrentUserId()

  const VALID_STATUSES = ['draft', 'active', 'final'] as const
  type Status = typeof VALID_STATUSES[number]
  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    throw new Error('Invalid status')
  }

  await db
    .update(reports)
    .set({ status: status as Status })
    .where(and(eq(reports.id, reportId), eq(reports.userId, userId)))

  revalidatePath(`/reports/${reportId}`)
  revalidatePath('/dashboard')
}

export async function deleteReport(reportId: string) {
  const userId = await getCurrentUserId()
  await db
    .delete(reports)
    .where(and(eq(reports.id, reportId), eq(reports.userId, userId)))
  revalidatePath('/dashboard')
  redirect('/dashboard')
}
