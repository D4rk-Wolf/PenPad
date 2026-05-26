import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/app/actions/reports'
import { createCheckoutSession, createCustomerPortalSession } from '@/lib/stripe'
import { Icons } from '@/components/penpad/icons'

async function startCheckout() {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const session = await createCheckoutSession(user.id, user.email!)
  redirect(session.url!)
}

async function openPortal() {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const sub = await getSubscription(user.id)
  if (!sub?.stripeCustomerId) redirect('/settings')
  const portal = await createCustomerPortalSession(sub.stripeCustomerId)
  redirect(portal.url)
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const sub = await getSubscription(user.id)
  const isPro = sub?.status === 'active'

  const NAV_ITEMS = ['Profile', 'Workspace', 'Billing', 'Security', 'API Keys', 'Audit Log', 'Danger Zone']

  return (
    <div className="content">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div className="settings-grid">
        {/* Side nav */}
        <nav className="settings-nav">
          {NAV_ITEMS.map((item, i) => (
            <div key={item} className={`settings-nav-item${i === 2 ? ' active' : ''}`}>{item}</div>
          ))}
        </nav>

        {/* Sections */}
        <div>
          {/* Profile */}
          <div className="settings-section">
            <h2 className="settings-section-title">Profile</h2>
            <p className="settings-section-sub">Your account information.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field">
                <label className="field-label">Email</label>
                <input className="input" type="email" defaultValue={user.email ?? ''} disabled style={{ opacity: 0.65 }} />
              </div>
              <div className="field">
                <label className="field-label">Full name <span className="field-optional">optional</span></label>
                <input className="input" type="text" defaultValue={user.user_metadata?.full_name ?? ''} placeholder="Jamie Foster" />
              </div>
              <div>
                <button className="btn btn-outline btn-sm" disabled>Save changes</button>
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* Billing */}
          <div className="settings-section">
            <h2 className="settings-section-title">Billing</h2>
            <p className="settings-section-sub">Manage your plan and usage.</p>

            <div className="plan-card">
              <div className="plan-card-top">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--fs-base)', marginBottom: '2px' }}>
                    {isPro ? 'Pro' : 'Free'} plan
                  </div>
                  <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>
                    {isPro
                      ? `Renews ${sub?.currentPeriodEnd?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) ?? '—'}`
                      : 'Up to 3 reports · 10 findings each'}
                  </div>
                </div>
                <span className={`pill ${isPro ? 'pill-status-final' : 'pill-status-draft'}`}>
                  <span className="pill-dot" />
                  {isPro ? 'Active' : 'Free'}
                </span>
              </div>

              {!isPro && (
                <div style={{ marginBottom: '16px' }}>
                  <div className="usage-row">
                    <span style={{ fontSize: 'var(--fs-sm)' }}>Reports</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="usage-bar">
                        <div className="usage-bar-fill" style={{ width: '33%' }} />
                      </div>
                      <span className="usage-meta">1 / 3</span>
                    </div>
                  </div>
                  <div className="usage-row">
                    <span style={{ fontSize: 'var(--fs-sm)' }}>Templates</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="usage-bar">
                        <div className="usage-bar-fill" style={{ width: '0%' }} />
                      </div>
                      <span className="usage-meta">0 / —</span>
                    </div>
                  </div>
                </div>
              )}

              {isPro ? (
                <form action={openPortal}>
                  <button type="submit" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.Globe size={13} />
                    Manage subscription
                  </button>
                </form>
              ) : (
                <form action={startCheckout}>
                  <button type="submit" className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Upgrade to Pro — £49/mo
                    <Icons.ArrowRight size={14} />
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="divider" />

          {/* Security */}
          <div className="settings-section">
            <h2 className="settings-section-title">Security</h2>
            <p className="settings-section-sub">Password and authentication settings.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field">
                <label className="field-label">Current password</label>
                <input className="input" type="password" placeholder="••••••••" />
              </div>
              <div className="field">
                <label className="field-label">New password</label>
                <input className="input" type="password" placeholder="••••••••" />
              </div>
              <div>
                <button className="btn btn-outline btn-sm" disabled>Update password</button>
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* Danger zone */}
          <div className="settings-section">
            <h2 className="settings-section-title" style={{ color: 'var(--sev-critical)' }}>Danger zone</h2>
            <p className="settings-section-sub">These actions are irreversible.</p>
            <button className="btn btn-outline btn-sm" style={{ color: 'var(--sev-critical)', borderColor: 'color-mix(in srgb, var(--sev-critical) 30%, transparent)', display: 'flex', alignItems: 'center', gap: '6px' }} disabled>
              <Icons.Trash size={13} />
              Delete account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
