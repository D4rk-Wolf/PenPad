import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { eq, and } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { reports } from '@/lib/db/schema'
import { getFindings } from '@/app/actions/findings'

export const metadata: Metadata = { robots: { index: false, follow: false } }
import { getMySubscription } from '@/lib/subscriptions'
import { getMyTemplates } from '@/app/actions/templates'

export const dynamic = 'force-dynamic'
import { FindingForm } from '@/components/findings/finding-form'
import { FindingCard } from '@/components/findings/finding-card'
import { Icons } from '@/components/penpad/icons'
import { SeverityCounts } from '@/components/penpad/ui'
import { StatusSelect } from '@/components/reports/status-select'
import { ExportAction } from '@/components/reports/export-action'

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) notFound()

  const [report] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.id, id), eq(reports.userId, user.id)))
    .limit(1)
  if (!report) notFound()

  const [findingList, sub, myTemplates] = await Promise.all([
    getFindings(id),
    getMySubscription(),
    getMyTemplates(),
  ])
  const isPro = sub?.status === 'active'

  const sorted = [...findingList].sort((a, b) =>
    (SEV_ORDER[a.severity as keyof typeof SEV_ORDER] ?? 4) -
    (SEV_ORDER[b.severity as keyof typeof SEV_ORDER] ?? 4)
  )

  const counts = sorted.reduce<Record<string, number>>((acc, f) => {
    const s = f.severity ?? 'info'
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="content">
      {/* Page header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link href="/dashboard" style={{ color: 'var(--fg-muted)', fontSize: 'var(--fs-sm)', textDecoration: 'none' }}>Reports</Link>
            <Icons.ChevronRight size={12} style={{ color: 'var(--fg-subtle)' }} />
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>{report.clientName}</span>
          </div>
          <h1 className="page-title">{report.clientName}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <StatusSelect reportId={id} status={(report.status ?? 'draft') as 'draft' | 'active' | 'final'} />
            {report.scope && <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>{report.scope}</span>}
            <SeverityCounts counts={counts} />
          </div>
        </div>
        <div className="page-header-actions">
          <ExportAction reportId={id} isPro={isPro} />
        </div>
      </div>

      {/* 2-col layout: findings list + add form */}
      <div className="layout-2col">
        {/* Findings */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontWeight: 600, fontSize: 'var(--fs-base)', margin: 0 }}>
              Findings <span style={{ color: 'var(--fg-muted)', fontWeight: 400 }}>({findingList.length})</span>
            </h2>
          </div>
          {sorted.length === 0 ? (
            <div className="empty">
              <div className="empty-icon"><Icons.Bug size={22} /></div>
              <p className="empty-title">No findings yet</p>
              <p className="empty-subtitle">Add your first finding using the form.</p>
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
              {sorted.map(finding => (
                <FindingCard key={finding.id} finding={finding} reportId={id} isPro={isPro} />
              ))}
            </div>
          )}
        </div>

        {/* Add finding form */}
        <div>
          <h2 style={{ fontWeight: 600, fontSize: 'var(--fs-base)', margin: '0 0 12px' }}>Add Finding</h2>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', padding: '20px' }}>
            <FindingForm reportId={id} myTemplates={myTemplates} isPro={isPro} />
          </div>
        </div>
      </div>
    </div>
  )
}
