import type { Metadata } from 'next'
import { getAnalyticsData } from '@/app/actions/admin'
import { SignupChart } from './charts'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }

function fmt(n: number) {
  return n.toLocaleString('en-GB')
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fmtRelative(iso: string | null) {
  if (!iso) return '—'
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const GRID_4 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '1px',
  background: 'var(--border)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-lg)',
  overflow: 'hidden',
  marginBottom: '16px',
} as const

function KpiStrip({ items }: { items: { label: string; value: string; sub?: string }[] }) {
  return (
    <div style={GRID_4}>
      {items.map(({ label, value, sub }) => (
        <div key={label} className="stat" style={{ background: 'var(--bg)', padding: '16px 20px' }}>
          <span className="stat-label">{label}</span>
          <span className="stat-value">
            {value}
            {sub && <span className="stat-unit">{sub}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

export default async function AdminAnalyticsPage() {
  const d = await getAnalyticsData()

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Internal dashboard · admin only</p>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-xs)',
          padding: '3px 8px',
          borderRadius: '3px',
          background: 'var(--accent-soft)',
          color: 'var(--accent-soft-fg)',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>Admin</span>
      </div>

      {/* ── Business ── */}
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-muted)', marginBottom: '8px' }}>Revenue</p>
      <KpiStrip items={[
        { label: 'MRR',             value: `£${fmt(d.mrr)}`, sub: '/mo' },
        { label: 'Pro subscribers', value: fmt(d.proCount) },
        { label: 'Free users',      value: fmt(d.freeCount) },
        { label: 'Conversion',      value: `${d.conversionRate.toFixed(1)}`, sub: '%' },
      ]} />

      {/* ── Users ── */}
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-muted)', marginBottom: '8px', marginTop: '4px' }}>Users</p>
      <KpiStrip items={[
        { label: 'Total users',     value: fmt(d.totalUsers) },
        { label: 'New (30d)',       value: fmt(d.newSignups30d) },
        { label: 'Active (30d)',    value: fmt(d.activeUsers30d) },
        { label: 'Churned (30d)',   value: fmt(d.churn30d) },
      ]} />

      {/* ── Product ── */}
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--fg-muted)', marginBottom: '8px', marginTop: '4px' }}>Product</p>
      <KpiStrip items={[
        { label: 'Total reports',   value: fmt(d.totalReports) },
        { label: 'Total findings',  value: fmt(d.totalFindings) },
        { label: 'Avg / report',    value: fmt(d.avgFindingsPerReport) },
        {
          label: 'Status split',
          value: `${d.reportsByStatus.draft}d · ${d.reportsByStatus.active}a · ${d.reportsByStatus.final}f`,
        },
      ]} />

      {/* ── Signup chart ── */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        background: 'var(--bg)',
        marginTop: '8px',
        marginBottom: '20px',
        overflow: 'hidden',
      }}>
        <div className="card-h">
          <span className="card-h-title" style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>Signups</span>
          <span className="card-h-meta">last 30 days</span>
        </div>
        <div style={{ padding: '16px 16px 12px' }}>
          <SignupChart data={d.signupsByDay} />
        </div>
      </div>

      {/* ── Recent sign-ins ── */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
        <div className="card-h">
          <span className="card-h-title" style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>Recent sign-ins</span>
          <span className="card-h-meta">last 10 sessions</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Last seen</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {d.recentSignIns.map((u) => (
              <tr key={u.email}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-sm)' }}>
                  {u.email}
                </td>
                <td>
                  {u.isPro ? (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: 'var(--accent-soft)',
                      color: 'var(--accent-soft-fg)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}>Pro</span>
                  ) : (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: 'var(--bg-muted)',
                      color: 'var(--fg-muted)',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}>Free</span>
                  )}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: 'var(--fg-secondary)' }}>
                  {fmtRelative(u.lastSignIn)}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: 'var(--fg-muted)' }}>
                  {fmtDate(u.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
