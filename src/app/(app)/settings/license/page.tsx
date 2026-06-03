import { getLicenseStatus, isSelfHosted } from '@/lib/license'

export default async function LicensePage() {
  if (!isSelfHosted()) {
    return (
      <div className="content">
        <div className="page-header">
          <h1 className="page-title">License</h1>
        </div>
        <p style={{ color: 'var(--fg-muted)', fontSize: 'var(--fs-sm)' }}>
          License keys apply to self-hosted deployments only. You are on the cloud-hosted version of PenPad.
        </p>
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
