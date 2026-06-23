'use server'

import { revalidatePath } from 'next/cache'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { requireUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { findings, findingImages, reports } from '@/lib/db/schema'
import { MAX_CAPTION_LEN } from '@/lib/images'

export async function assertFindingOwner(findingId: string): Promise<{ userId: string; reportId: string }> {
  const user = await requireUser()
  const [row] = await db
    .select({ reportId: findings.reportId })
    .from(findings)
    .innerJoin(reports, eq(reports.id, findings.reportId))
    .where(and(eq(findings.id, findingId), eq(reports.userId, user.id)))
    .limit(1)
  if (!row) throw new Error('Finding not found')
  return { userId: user.id, reportId: row.reportId }
}

/** Metadata only — never returns bytes. */
export async function listFindingImages(findingId: string) {
  await assertFindingOwner(findingId)
  return db
    .select({ id: findingImages.id, caption: findingImages.caption, sortOrder: findingImages.sortOrder })
    .from(findingImages)
    .where(eq(findingImages.findingId, findingId))
    .orderBy(asc(findingImages.sortOrder), asc(findingImages.createdAt))
}

const CaptionSchema = z.string().max(MAX_CAPTION_LEN)

export async function updateImageCaption(imageId: string, caption: string) {
  const fid = await imageFindingId(imageId)
  await assertFindingOwner(fid)
  const value = CaptionSchema.parse(caption)
  await db.update(findingImages).set({ caption: value }).where(eq(findingImages.id, imageId))
  await revalidatePathForFinding(fid)
}

export async function reorderImages(findingId: string, orderedIds: string[]) {
  await assertFindingOwner(findingId)
  await Promise.all(orderedIds.map((id, i) =>
    db.update(findingImages).set({ sortOrder: i }).where(and(eq(findingImages.id, id), eq(findingImages.findingId, findingId)))
  ))
  await revalidatePathForFinding(findingId)
}

export async function deleteImage(imageId: string) {
  const fid = await imageFindingId(imageId)
  await assertFindingOwner(fid)
  await db.delete(findingImages).where(eq(findingImages.id, imageId))
  await revalidatePathForFinding(fid)
}

async function imageFindingId(imageId: string): Promise<string> {
  const [row] = await db.select({ findingId: findingImages.findingId }).from(findingImages).where(eq(findingImages.id, imageId)).limit(1)
  if (!row) throw new Error('Image not found')
  return row.findingId
}

async function revalidatePathForFinding(findingId: string) {
  const [row] = await db.select({ reportId: findings.reportId }).from(findings).where(eq(findings.id, findingId)).limit(1)
  if (row?.reportId) revalidatePath(`/reports/${row.reportId}`)
}

/** Fetch all image metadata for every finding in a report, in one query. */
export async function listImagesForReport(reportId: string) {
  const user = await requireUser()
  const [r] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.id, reportId), eq(reports.userId, user.id)))
    .limit(1)
  if (!r) throw new Error('Report not found')
  return db
    .select({
      id: findingImages.id,
      findingId: findingImages.findingId,
      caption: findingImages.caption,
      sortOrder: findingImages.sortOrder,
    })
    .from(findingImages)
    .innerJoin(findings, eq(findings.id, findingImages.findingId))
    .where(eq(findings.reportId, reportId))
    .orderBy(asc(findingImages.sortOrder), asc(findingImages.createdAt))
}
