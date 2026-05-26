import Link from 'next/link'
import { ReportForm } from '@/components/reports/report-form'
import { Icons } from '@/components/penpad/icons'

export default function NewReportPage() {
  return (
    <div className="content">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link href="/dashboard" style={{ color: 'var(--fg-muted)', fontSize: 'var(--fs-sm)', textDecoration: 'none' }}>Reports</Link>
            <Icons.ChevronRight size={12} style={{ color: 'var(--fg-subtle)' }} />
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>New report</span>
          </div>
          <h1 className="page-title">New Report</h1>
        </div>
      </div>
      <ReportForm />
    </div>
  )
}
