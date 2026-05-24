import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ReportCard } from '@/components/reports/report-card'
import { getReports } from '@/app/actions/reports'
import { FREE_REPORT_LIMIT } from '@/lib/utils'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const reportList = await getReports()
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user!.id))
  const isPro = sub?.status === 'active'
  const atFreeLimit = !isPro && reportList.length >= FREE_REPORT_LIMIT

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          {!isPro && (
            <p className="text-sm text-muted-foreground mt-1">
              {reportList.length}/{FREE_REPORT_LIMIT} free reports used
            </p>
          )}
        </div>
        {atFreeLimit ? (
          <Button render={<Link href="/settings" />}>Upgrade to Pro</Button>
        ) : (
          <Button render={<Link href="/reports/new" />}>New Report</Button>
        )}
      </div>

      {reportList.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          No reports yet. Create your first one.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportList.map(report => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  )
}
