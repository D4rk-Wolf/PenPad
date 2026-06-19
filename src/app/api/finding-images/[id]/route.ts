import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { requireUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { findingImages, findings, reports } from '@/lib/db/schema'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const [row] = await db
    .select({ data: findingImages.data, mimeType: findingImages.mimeType })
    .from(findingImages)
    .innerJoin(findings, eq(findings.id, findingImages.findingId))
    .innerJoin(reports, eq(reports.id, findings.reportId))
    .where(and(eq(findingImages.id, id), eq(reports.userId, user.id)))
    .limit(1)
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return new NextResponse(new Uint8Array(row.data), {
    headers: { 'Content-Type': row.mimeType, 'Cache-Control': 'private, max-age=60' },
  })
}
