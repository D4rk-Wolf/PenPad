'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteFinding } from '@/app/actions/findings'
import { saveTemplate } from '@/app/actions/templates'
import { SEVERITY_COLOURS, SEVERITY_BORDER_COLOURS } from '@/lib/utils'
import type { Finding } from '@/lib/db/schema'
import type { Severity } from '@/lib/utils'

export function FindingCard({
  finding,
  reportId,
  isPro,
}: {
  finding: Finding
  reportId: string
  isPro: boolean
}) {
  const severity = (finding.severity ?? 'info') as Severity

  return (
    <Card>
      <CardHeader className={`pb-2 border-l-4 ${SEVERITY_BORDER_COLOURS[severity] ?? 'border-l-slate-300'} pl-4`}>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{finding.title}</CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEVERITY_COLOURS[severity]}`}>
              {severity.toUpperCase()}
            </span>
            <span className="text-xs text-muted-foreground">
              CVSS {Number(finding.cvssScore).toFixed(1)}
            </span>
          </div>
        </div>
        {(finding as any).affectedComponent && (
          <p className="text-xs font-mono text-muted-foreground mt-1">{(finding as any).affectedComponent}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {finding.description && (
          <div><span className="font-medium">Description: </span>{finding.description}</div>
        )}
        {finding.impact && (
          <div><span className="font-medium">Impact: </span>{finding.impact}</div>
        )}
        {finding.recommendation && (
          <div><span className="font-medium">Recommendation: </span>{finding.recommendation}</div>
        )}
        {finding.evidence && (
          <pre className="bg-muted p-2 rounded text-xs overflow-auto">{finding.evidence}</pre>
        )}
        <div className="flex items-center gap-2 pt-1">
          <form action={deleteFinding.bind(null, finding.id, reportId)}>
            <Button variant="ghost" size="sm" type="submit"
              className="text-destructive hover:text-destructive h-7 px-2">
              Remove
            </Button>
          </form>
          {isPro && (
            <form action={saveTemplate.bind(null, finding.id)}>
              <Button variant="ghost" size="sm" type="submit" className="h-7 px-2">
                Save as template
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
