import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { reports, subscriptions } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { getFindings } from '@/app/actions/findings'
import { FindingForm } from '@/components/findings/finding-form'
import { FindingCard } from '@/components/findings/finding-card'
import { Button } from '@/components/ui/button'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [report] = await db.select().from(reports)
    .where(and(eq(reports.id, id), eq(reports.userId, user!.id)))
  if (!report) notFound()

  const findingList = await getFindings(id)

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user!.id))
  const isPro = sub?.status === 'active'

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
  const sorted = [...findingList].sort((a, b) =>
    (severityOrder[a.severity as keyof typeof severityOrder] ?? 4) -
    (severityOrder[b.severity as keyof typeof severityOrder] ?? 4)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{report.clientName}</h1>
          {report.scope && <p className="text-sm text-muted-foreground mt-1">{report.scope}</p>}
        </div>
        <div className="flex items-center gap-3">
          {isPro ? (
            <Button asChild>
              <Link href={`/reports/${id}/export`} target="_blank">Export PDF</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/settings">Upgrade for PDF export</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold mb-4">Findings ({findingList.length})</h2>
          <div className="space-y-3">
            {sorted.map(finding => (
              <FindingCard key={finding.id} finding={finding} reportId={id} />
            ))}
            {findingList.length === 0 && (
              <p className="text-muted-foreground text-sm">No findings yet.</p>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Add Finding</h2>
          <FindingForm reportId={id} />
        </div>
      </div>
    </div>
  )
}
