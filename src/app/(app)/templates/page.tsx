import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyTemplates, deleteTemplate } from '@/app/actions/templates'
import { getMySubscription } from '@/lib/subscriptions'
import { Icons } from '@/components/penpad/icons'
import { SeverityPill } from '@/components/penpad/ui'
import type { Severity } from '@/lib/utils'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const sub = await getMySubscription()
  const isPro = sub?.status === 'active'
  const templates = isPro ? await getMyTemplates() : []

  const categories = ['All']

  return (
    <div className="content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-subtitle">
            {isPro ? `${templates.length} saved template${templates.length !== 1 ? 's' : ''}` : 'Pro feature'}
          </p>
        </div>
      </div>

      {!isPro && (
        <div style={{ padding: '20px 24px', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', background: 'var(--bg-elev)', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <Icons.Lock size={18} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 500, fontSize: 'var(--fs-sm)', marginBottom: '2px' }}>Custom templates require Pro</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>Save findings as reusable templates and import them across engagements.</div>
          </div>
          <Link href="/settings" className="btn btn-accent btn-sm" style={{ marginLeft: 'auto', flexShrink: 0 }}>
            Upgrade to Pro
          </Link>
        </div>
      )}

      {isPro && (
        <div className="tpl-grid">
          {/* Category sidebar */}
          <div>
            <div style={{ fontSize: 'var(--fs-xs)', fontFamily: 'var(--font-mono)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: '8px', padding: '0 10px' }}>
              Categories
            </div>
            <div className="tpl-cat-list">
              {categories.map(cat => (
                <div key={cat} className="tpl-cat active">
                  <span>{cat}</span>
                  <span className="tpl-cat-count">{templates.length}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Template table */}
          <div className="tpl-table-wrap">
            <div className="tpl-toolbar">
              <div className="tpl-search">
                <Icons.Search size={14} />
                <input placeholder="Search templates…" />
              </div>
            </div>

            {templates.length === 0 ? (
              <div className="empty">
                <div className="empty-icon"><Icons.Stack size={22} /></div>
                <p className="empty-title">No templates yet</p>
                <p className="empty-subtitle">On any finding, click &quot;Save as template&quot; to build your library.</p>
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Category</th>
                    <th>CVSS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(t => {
                    const severity = (t.severity ?? 'info') as Severity
                    const cvss = Number(t.cvssScore ?? 0)
                    return (
                      <tr key={t.id} className="tbl-row">
                        <td style={{ fontWeight: 500 }}>{t.title}</td>
                        <td><SeverityPill severity={severity as 'critical' | 'high' | 'medium' | 'low' | 'info'} /></td>
                        <td style={{ color: 'var(--fg-muted)', fontSize: 'var(--fs-sm)' }}>—</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: cvss > 0 ? 'var(--fg)' : 'var(--fg-muted)' }}>
                          {cvss > 0 ? cvss.toFixed(1) : '—'}
                        </td>
                        <td>
                          <form action={deleteTemplate.bind(null, t.id)} style={{ display: 'contents' }}>
                            <button type="submit" className="btn btn-ghost btn-icon" aria-label="Delete template">
                              <Icons.Trash size={13} style={{ color: 'var(--fg-muted)' }} />
                            </button>
                          </form>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
