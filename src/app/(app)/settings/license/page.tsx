import { getLicenseStatus, isSelfHosted } from '@/lib/license'
import { getCloudLicense, getTrialEndsAt } from '@/lib/subscriptions'
import { startProCheckout } from '@/app/actions/billing'

export default async function LicensePage() {
  if (!isSelfHosted()) {
    const { licenseKey } = await getCloudLicense()
    const trialEndsAt = await getTrialEndsAt()

    if (licenseKey) {
      const dockerCmd = `docker run -d \\
  -e PENPAD_LICENSE_KEY=${licenseKey} \\
  -p 3000:3000 \\
  ghcr.io/d4rk-wolf/penpad:latest`

      return (
        <div className="content">
          <div className="page-header">
            <h1 className="page-title">License</h1>
          </div>
          <div style={{ maxWidth: '560px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <p style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: '12px' }}>
                Your PenPad Pro license
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--fg-muted)', fontSize: 'var(--fs-sm)' }}>License key</span>
                <code style={{ fontSize: 'var(--fs-xs, 12px)', userSelect: 'all' }}>{licenseKey}</code>
              </div>
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: 'var(--fs-xs, 12px)', color: 'var(--fg-muted)', marginBottom: '8px' }}>
                  Docker quickstart
                </p>
                <pre style={{
                  background: 'var(--surface-raised, var(--surface))',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: 'var(--fs-xs, 12px)',
                  overflowX: 'auto',
                  userSelect: 'all',
                  lineHeight: 1.6,
                }}>
                  <code>{dockerCmd}</code>
                </pre>
              </div>
            </div>
            <p style={{ marginTop: '12px', fontSize: 'var(--fs-xs, 12px)', color: 'var(--fg-subtle)' }}>
              For full setup instructions see{' '}
              <a href="/docs/self-hosting" style={{ color: 'var(--accent)' }}>
                the self-hosting guide
              </a>.
            </p>
          </div>
        </div>
      )
    }

    const now = new Date()
    const hasActiveTrial = trialEndsAt != null && trialEndsAt > now
    const daysLeft = hasActiveTrial
      ? Math.ceil((trialEndsAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return (
      <div className="content">
        <div className="page-header">
          <h1 className="page-title">License</h1>
        </div>
        <div style={{ maxWidth: '480px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <p style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, marginBottom: '8px' }}>
              Self-hosted license
            </p>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', marginBottom: '16px' }}>
              {hasActiveTrial
                ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your Pro trial`
                : 'Your Pro trial has ended.'}
            </p>
            <form action={startProCheckout}>
              <button type="submit" className="btn btn-accent">
                Get PenPad Pro — £49/mo (self-hosted)
              </button>
            </form>
          </div>
          <p style={{ marginTop: '12px', fontSize: 'var(--fs-xs, 12px)', color: 'var(--fg-subtle)' }}>
            A license key for self-hosting will be emailed to you immediately after purchase.
          </p>
        </div>
      </div>
    )
  }

  const license = await getLicenseStatus()

  return (
    <div className="content">
      <div className="page-header">
        <h1 className="page-title">License</h1>
      </div>
      <div style={{ maxWidth: '480px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--fg-muted)', fontSize: 'var(--fs-sm)' }}>Status</span>
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: license.valid ? 'var(--green-600, #16a34a)' : 'var(--red-600, #dc2626)' }}>
              {license.valid ? 'Active' : 'Invalid'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--fg-muted)', fontSize: 'var(--fs-sm)' }}>Tier</span>
            <span style={{ fontSize: 'var(--fs-sm)', textTransform: 'capitalize' }}>{license.tier}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ color: 'var(--fg-muted)', fontSize: 'var(--fs-sm)' }}>Code</span>
            <code style={{ fontSize: 'var(--fs-xs, 12px)' }}>{license.code}</code>
          </div>
        </div>
        <p style={{ marginTop: '12px', fontSize: 'var(--fs-xs, 12px)', color: 'var(--fg-subtle)' }}>
          To update your license key, set <code>PENPAD_LICENSE_KEY</code> in your environment and restart the container.
        </p>
      </div>
    </div>
  )
}
