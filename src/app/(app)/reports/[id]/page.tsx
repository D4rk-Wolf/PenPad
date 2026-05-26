import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { adminDb, camel } from '@/lib/supabase/admin'
import type { Report } from '@/lib/db/schema'
import { getFindings } from '@/app/actions/findings'
import { getSubscription } from '@/app/actions/reports'
import { getMyTemplates } from '@/app/actions/templates'
import { FindingForm } from '@/components/findings/finding-form'
import { FindingCard } from '@/components/findings/finding-card'
import { Icons } from '@/components/penpad/icons'
import { SeverityPill, CvssGauge, StatusPill, SeverityCounts } from '@/components/penpad/ui'

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: reportRow } = await adminDb()
    .from('reports')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .maybeSingle()
  if (!reportRow) notFound()
  const report = camel<Report>(reportRow as Record<string, unknown>)

  const [findingList, sub, myTemplates] = await Promise.all([
    getFindings(id),
    getSubscription(user!.id),
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
            <Link href="/dashboard" style={{ color: 'var(--fg-muted)', fontSize: 'var(--text-sm)', textDecoration: 'none' }}>Reports</Link>
            <Icons.ChevronRight size={12} style={{ color: 'var(--fg-subtle)' }} />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-muted)' }}>{report.clientName}</span>
          </div>
          <h1 className="page-title">{report.clientName}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <StatusPill status={(report.status ?? 'draft') as 'draft' | 'active' | 'final'} />
            {report.scope && <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-muted)' }}>{report.scope}</span>}
            <SeverityCounts counts={counts} />
          </div>
        </div>
        <div className="page-header-actions">
          {isPro ? (
            <Link href={`/reports/${id}/export`} target="_blank" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icons.Download size={14} />
              Export PDF
            </Link>
          ) : (
            <Link href="/settings" className="btn btn-outline btn-sm">Upgrade for PDF</Link>
          )}
        </div>
      </div>

      {/* 2-col layout: findings list + add form */}
      <div className="layout-2col">
        {/* Findings */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontWeight: 600, fontSize: 'var(--text-base)', margin: 0 }}>
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
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              {sorted.map(finding => (
                <FindingCard key={finding.id} finding={finding} reportId={id} isPro={isPro} />
              ))}
            </div>
          )}
        </div>

        {/* Add finding form */}
        <div>
          <h2 style={{ fontWeight: 600, fontSize: 'var(--text-base)', margin: '0 0 12px' }}>Add Finding</h2>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: '20px' }}>
            <FindingForm reportId={id} myTemplates={myTemplates} isPro={isPro} />
          </div>
        </div>
      </div>
    </div>
  )
}
