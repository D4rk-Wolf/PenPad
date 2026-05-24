// src/app/(app)/reports/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { reports, findings, subscriptions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { ReportDocument } from '@/components/pdf/report-document'
import React from 'react'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // Check Pro subscription
  const [sub] = await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, user.id))

  if (sub?.status !== 'active') {
    return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 })
  }

  // Verify ownership
  const [report] = await db.select().from(reports)
    .where(and(eq(reports.id, id), eq(reports.userId, user.id)))
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const findingList = await db.select().from(findings).where(eq(findings.reportId, id))

  const buffer = await renderToBuffer(
    React.createElement(ReportDocument, { report, findings: findingList })
  )

  const filename = `penpad-${report.clientName.replace(/\s+/g, '-').toLowerCase()}.pdf`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
