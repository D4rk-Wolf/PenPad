import Link from 'next/link'
import { getReports } from '@/app/actions/reports'
import { Icons } from '@/components/penpad/icons'
import { StatusPill } from '@/components/penpad/ui'

// User-specific data — always render fresh, never serve a cached response
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const reportList = await getReports()
  const activeCount = reportList.filter(r => r.status === 'active').length
  const draftCount = reportList.filter(r => r.status === 'draft').length

  return (
    <div className="content">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">{reportList.length} engagement{reportList.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-header-actions">
          <Link href="/reports/new" className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icons.Plus size={14} />
            New report
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: '24px' }}>
        {[
          { label: 'Total reports', value: String(reportList.length) },
          { label: 'Active', value: String(activeCount) },
          { label: 'Draft', value: String(draftCount) },
          { label: 'Final', value: String(reportList.filter(r => r.status === 'final').length) },
        ].map(({ label, value }) => (
          <div key={label} className="stat" style={{ background: 'var(--bg)', padding: '16px 20px' }}>
            <span className="stat-label">{label}</span>
            <span className="stat-value">{value}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Icons.Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Search reports…" style={{ paddingLeft: '30px', width: '100%' }} />
        </div>
        <button className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icons.Filter size={14} />
          Filter
        </button>
        <button className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icons.Export size={14} />
          Export
        </button>
      </div>

      {/* Reports table */}
      {reportList.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><Icons.Reports size={24} /></div>
          <p className="empty-title">No reports yet</p>
          <p className="empty-subtitle">Create your first engagement report to get started.</p>
          <div className="empty-action">
            <Link href="/reports/new" className="btn btn-accent btn-sm">New report</Link>
          </div>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Report</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reportList.map(report => {
                const href = `/reports/${report.id}`
                return (
                  <tr key={report.id} className="tbl-row">
                    <td>
                      <Link href={href} style={{ fontWeight: 500, color: 'var(--fg)', textDecoration: 'none' }}>
                        {report.clientName}
                      </Link>
                    </td>
                    <td>
                      <StatusPill status={(report.status ?? 'draft') as 'draft' | 'active' | 'final'} />
                    </td>
                    <td style={{ color: 'var(--fg-muted)', fontSize: 'var(--fs-sm)' }}>—</td>
                    <td style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>
                      {report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <Link href={href} className="btn btn-ghost btn-icon" aria-label="Open report">
                        <Icons.ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
