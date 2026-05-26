'use client'

import { deleteFinding } from '@/app/actions/findings'
import { saveTemplate } from '@/app/actions/templates'
import { Icons } from '@/components/penpad/icons'
import { SeverityPill, CvssGauge } from '@/components/penpad/ui'
import type { Finding } from '@/lib/db/schema'

export function FindingCard({
  finding,
  reportId,
  isPro,
}: {
  finding: Finding
  reportId: string
  isPro: boolean
}) {
  const severity = (finding.severity ?? 'info') as 'critical' | 'high' | 'medium' | 'low' | 'info'
  const cvss = Number(finding.cvssScore ?? 0)

  return (
    <div className="finding-expand-card">
      <div className="finding-row-top">
        <SeverityPill severity={severity} />
        <span className="finding-row-title">{finding.title}</span>
        <CvssGauge score={cvss} />
      </div>
      {finding.affectedComponent && (
        <div className="finding-row-component">{finding.affectedComponent}</div>
      )}
      {finding.description && (
        <div className="finding-detail-section">
          <h4>Description</h4>
          <p>{finding.description}</p>
        </div>
      )}
      {finding.impact && (
        <div className="finding-detail-section">
          <h4>Impact</h4>
          <p>{finding.impact}</p>
        </div>
      )}
      {finding.recommendation && (
        <div className="finding-detail-section">
          <h4>Recommendation</h4>
          <p>{finding.recommendation}</p>
        </div>
      )}
      {finding.evidence && (
        <div className="finding-detail-section">
          <h4>Evidence</h4>
          <pre className="code-block">{finding.evidence}</pre>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <form action={deleteFinding.bind(null, finding.id, reportId)}>
          <button type="submit" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--crit)' }}>
            <Icons.Trash size={13} />
            Remove
          </button>
        </form>
        {isPro && (
          <form action={saveTemplate.bind(null, finding.id)}>
            <button type="submit" className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icons.Stack size={13} />
              Save as template
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
