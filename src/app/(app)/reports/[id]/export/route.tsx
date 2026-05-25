// src/app/(app)/reports/[id]/export/route.tsx
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { adminDb(), camel } from '@/lib/supabase/admin'
import type { Report, Finding, Subscription } from '@/lib/db/schema'
import { ReportDocument } from '@/components/pdf/report-document'

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

  const { data: findingRows } = await adminDb()
    .from('findings')
    .select('*')
    .eq('report_id', id)
  const findingList = (findingRows ?? []).map(f => camel<Finding>(f as Record<string, unknown>))

  const buffer = await renderToBuffer(
    <ReportDocument report={report} findings={findingList} />
  )

  const filename = `penpad-${report.clientName.replace(/\s+/g, '-').toLowerCase()}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
