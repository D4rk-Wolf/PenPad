import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyTemplates } from '@/app/actions/templates'
import { getMySubscription } from '@/lib/subscriptions'

export const metadata: Metadata = { robots: { index: false, follow: false } }
import { TemplateList } from '@/components/templates/template-list'
import { Icons } from '@/components/penpad/icons'

export const dynamic = 'force-dynamic'

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

          {/* Template table — client component handles search state */}
          <TemplateList templates={templates} />
        </div>
      )}
    </div>
  )
}
