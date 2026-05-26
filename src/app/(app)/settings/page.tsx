import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/app/actions/reports'
import { createCheckoutSession, createCustomerPortalSession } from '@/lib/stripe'
import { updateProfile, updatePassword, deleteAccount } from '@/app/actions/settings'
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

const SUCCESS_MESSAGES: Record<string, string> = {
  profile:  'Profile updated successfully.',
  security: 'Password updated successfully.',
}

const ERROR_MESSAGES: Record<string, string> = {
  profile:         'Failed to update profile. Please try again.',
  password:        'Failed to update password. Please try again.',
  'password-short': 'New password must be at least 8 characters.',
  'password-same':  'New password must be different from your current password.',
  'password-wrong': 'Current password is incorrect.',
  'delete-confirm': "Type exactly 'delete my account' to confirm.",
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sub = await getSubscription(user.id)
  const isPro = sub?.status === 'active'

  const { success, error } = await searchParams
  const successMsg = success ? SUCCESS_MESSAGES[success] : null
  const errorMsg = error ? (ERROR_MESSAGES[error] ?? 'Something went wrong.') : null

  const NAV_ITEMS = [
    { label: 'Profile',     href: '#profile' },
    { label: 'Billing',     href: '#billing' },
    { label: 'Security',    href: '#security' },
    { label: 'Danger Zone', href: '#danger' },
  ]

  return (
    <div className="content">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {(successMsg || errorMsg) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: 'var(--r-md)',
          marginBottom: '20px',
          background: successMsg
            ? 'color-mix(in srgb, var(--accent) 10%, transparent)'
            : 'color-mix(in srgb, var(--sev-critical) 10%, transparent)',
          border: `1px solid ${successMsg
            ? 'color-mix(in srgb, var(--accent) 25%, transparent)'
            : 'color-mix(in srgb, var(--sev-critical) 25%, transparent)'}`,
          color: successMsg ? 'var(--accent)' : 'var(--sev-critical)',
          fontSize: 'var(--fs-sm)',
        }}>
          {successMsg
            ? <Icons.Check size={14} style={{ flexShrink: 0 }} />
            : <Icons.AlertTriangle size={14} style={{ flexShrink: 0 }} />
          }
          {successMsg ?? errorMsg}
        </div>
      )}

      <div className="settings-grid">
        {/* Side nav */}
        <nav className="settings-nav">
          {NAV_ITEMS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="settings-nav-item"
              style={{ textDecoration: 'none' }}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Sections */}
        <div>
          {/* Profile */}
          <div id="profile" className="settings-section" style={{ scrollMarginTop: '80px' }}>
            <h2 className="settings-section-title">Profile</h2>
            <p className="settings-section-sub">Your account information.</p>
            <form action={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field">
                <label className="field-label">Email</label>
                <input className="input" type="email" defaultValue={user.email ?? ''} disabled style={{ opacity: 0.65 }} />
              </div>
              <div className="field">
                <label className="field-label">Full name <span className="field-optional">optional</span></label>
                <input
                  className="input"
                  type="text"
                  name="fullName"
                  defaultValue={user.user_metadata?.full_name ?? ''}
                  placeholder="Jamie Foster"
                  maxLength={100}
                />
              </div>
              <div>
                <button type="submit" className="btn btn-outline btn-sm">Save changes</button>
              </div>
            </form>
          </div>

          <div className="divider" />

          {/* Billing */}
          <div id="billing" className="settings-section" style={{ scrollMarginTop: '80px' }}>
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
          <div id="security" className="settings-section" style={{ scrollMarginTop: '80px' }}>
            <h2 className="settings-section-title">Security</h2>
            <p className="settings-section-sub">Change your password.</p>
            <form action={updatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="field">
                <label className="field-label">Current password</label>
                <input className="input" type="password" name="currentPassword" placeholder="••••••••" required autoComplete="current-password" />
              </div>
              <div className="field">
                <label className="field-label">New password <span className="field-hint">Min 8 characters</span></label>
                <input className="input" type="password" name="newPassword" placeholder="••••••••" required minLength={8} autoComplete="new-password" />
              </div>
              <div>
                <button type="submit" className="btn btn-outline btn-sm">Update password</button>
              </div>
            </form>
          </div>

          <div className="divider" />

          {/* Danger zone */}
          <div id="danger" className="settings-section" style={{ scrollMarginTop: '80px' }}>
            <h2 className="settings-section-title" style={{ color: 'var(--sev-critical)' }}>Danger zone</h2>
            <p className="settings-section-sub">Permanently delete your account and all data. This cannot be undone.</p>
            <form action={deleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
              <div className="field">
                <label className="field-label">
                  Type <strong style={{ color: 'var(--fg)' }}>delete my account</strong> to confirm
                </label>
                <input
                  className="input"
                  type="text"
                  name="confirmation"
                  placeholder="delete my account"
                  required
                  autoComplete="off"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="btn btn-outline btn-sm"
                  style={{ color: 'var(--sev-critical)', borderColor: 'color-mix(in srgb, var(--sev-critical) 30%, transparent)', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icons.Trash size={13} />
                  Delete account
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
