'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteFinding } from '@/app/actions/findings'
import { SEVERITY_COLOURS } from '@/lib/utils'
import type { Finding } from '@/lib/db/schema'
import type { Severity } from '@/lib/utils'

export function FindingCard({ finding, reportId }: { finding: Finding; reportId: string }) {
  const severity = (finding.severity ?? 'info') as Severity

  return (
    <Card>
      <CardHeader className="pb-2">
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
        <form action={deleteFinding.bind(null, finding.id, reportId)} className="pt-1">
          <Button variant="ghost" size="sm" type="submit"
            className="text-destructive hover:text-destructive h-7 px-2">
            Remove
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
