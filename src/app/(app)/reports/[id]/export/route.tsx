// src/app/(app)/reports/[id]/export/route.tsx
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { eq, and, asc } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { reports, findings, subscriptions, userBranding } from '@/lib/db/schema'
import { ReportDocument } from '@/components/pdf/report-document'
import { captureServer } from '@/lib/analytics/server'

// Force Node.js runtime — react-pdf uses Node-only APIs (fs, Buffer)
export const runtime = 'nodejs'

// Cap the number of findings included in a PDF render to prevent runaway
// memory usage on pathologically large reports.
const MAX_FINDINGS_IN_EXPORT = 200

// Maximum time (ms) to wait for react-pdf to render before giving up.
// vercel.json sets maxDuration=60s for this route; we abort a few seconds
// earlier so we can return a clean 504 rather than a hard Vercel timeout.
const RENDER_TIMEOUT_MS = 30_000

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const [subRow] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1)
  const sub = subRow ?? null

  if (sub?.status !== 'active') {
    await captureServer(user.id, 'pdf_export_blocked', { report_id: id, source: 'export_route' })
    return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 })
  }

  const [report] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, id), eq(reports.userId, user.id)))
    .limit(1)
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [findingList, brandingRow] = await Promise.all([
    db.select().from(findings)
      .where(eq(findings.reportId, id))
      .orderBy(asc(findings.sortOrder), asc(findings.createdAt))
      .limit(MAX_FINDINGS_IN_EXPORT),
    db.select().from(userBranding)
      .where(eq(userBranding.userId, user.id))
      .limit(1),
  ])
  const branding = brandingRow[0] ?? undefined

  // Race the render against a hard timeout so we never hit the Vercel wall-clock limit silently
  let buffer: Buffer
  try {
    const renderPromise = renderToBuffer(
      <ReportDocument report={report} findings={findingList} branding={branding} />
    )
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('PDF render timed out')), RENDER_TIMEOUT_MS)
    )
    buffer = await Promise.race([renderPromise, timeoutPromise])
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === 'PDF render timed out'
    console.error('[export] PDF render failed:', err)
    return NextResponse.json(
      { error: isTimeout ? 'PDF generation timed out. Try again or contact support.' : 'Failed to generate PDF' },
      { status: isTimeout ? 504 : 500 }
    )
  }

  // Strip characters that could break Content-Disposition header parsing
  const safeClient = report.clientName
    .replace(/[^a-zA-Z0-9\-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 80)
  const filename = `penpad-${safeClient || 'report'}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
