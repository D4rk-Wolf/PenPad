'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { reports, subscriptions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { FREE_REPORT_LIMIT } from '@/lib/utils'

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  return user.id
}

export async function getReports() {
  const userId = await getCurrentUserId()
  return db.select().from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(reports.createdAt)
}

export async function createReport(formData: FormData) {
  const userId = await getCurrentUserId()

  const existing = await db.select({ id: reports.id }).from(reports)
    .where(eq(reports.userId, userId))

  const [sub] = await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId))

  const isPro = sub?.status === 'active'

  if (!isPro && existing.length >= FREE_REPORT_LIMIT) {
    throw new Error(`Free tier limited to ${FREE_REPORT_LIMIT} reports. Upgrade to Pro for unlimited.`)
  }

  const [report] = await db.insert(reports).values({
    userId,
    clientName: formData.get('clientName') as string,
    scope:      formData.get('scope') as string || null,
    startDate:  formData.get('startDate') as string || null,
    endDate:    formData.get('endDate') as string || null,
    testerName: formData.get('testerName') as string || null,
  }).returning()

  revalidatePath('/dashboard')
  redirect(`/reports/${report.id}`)
}

export async function updateReport(reportId: string, formData: FormData) {
  const userId = await getCurrentUserId()
  await db.update(reports)
    .set({
      clientName: formData.get('clientName') as string,
      scope:      formData.get('scope') as string || null,
      startDate:  formData.get('startDate') as string || null,
      endDate:    formData.get('endDate') as string || null,
      testerName: formData.get('testerName') as string || null,
    })
    .where(and(eq(reports.id, reportId), eq(reports.userId, userId)))
  revalidatePath(`/reports/${reportId}`)
  revalidatePath('/dashboard')
}

export async function deleteReport(reportId: string) {
  const userId = await getCurrentUserId()
  await db.delete(reports)
    .where(and(eq(reports.id, reportId), eq(reports.userId, userId)))
  revalidatePath('/dashboard')
  redirect('/dashboard')
}
