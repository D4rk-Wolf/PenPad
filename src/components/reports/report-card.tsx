'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { deleteReport } from '@/app/actions/reports'
import type { Report } from '@/lib/db/schema'

export function ReportCard({ report }: { report: Report }) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          <Link href={`/reports/${report.id}`} className="hover:underline">
            {report.clientName}
          </Link>
        </CardTitle>
        {report.status === 'final' ? (
          <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">Final</span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-medium">Draft</span>
        )}
      </CardHeader>
      <CardContent>
        {report.scope && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{report.scope}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {report.startDate} – {report.endDate ?? 'ongoing'}
          </span>
          <form action={deleteReport.bind(null, report.id)}>
            <Button variant="ghost" size="sm" type="submit"
              className="text-destructive hover:text-destructive">
              Delete
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
