// src/app/(app)/reports/[id]/export/route.tsx
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { adminDb, camel } from '@/lib/supabase/admin'
import type { Report, Finding, Subscription, UserBranding } from '@/lib/db/schema'
import { ReportDocument } from '@/components/pdf/report-document'

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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: subRow } = await adminDb()
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  const sub = subRow ? camel<Subscription>(subRow as Record<string, unknown>) : null

  if (sub?.status !== 'active') {
    return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 })
  }

  const { data: reportRow } = await adminDb()
    .from('reports')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!reportRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const report = camel<Report>(reportRow as Record<string, unknown>)

  const [{ data: findingRows }, { data: brandingRow }] = await Promise.all([
    adminDb()
      .from('findings')
      .select('*')
      .eq('report_id', id)
      .order('sort_order')
      .order('created_at')
      .limit(MAX_FINDINGS_IN_EXPORT),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adminDb() as any)
      .from('user_branding')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])
  const findingList = (findingRows ?? []).map(f => camel<Finding>(f as Record<string, unknown>))
  const branding = brandingRow ? camel<UserBranding>(brandingRow as Record<string, unknown>) : undefined

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
