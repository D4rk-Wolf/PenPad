import 'server-only'

import { redirect, notFound } from 'next/navigation'
import { count } from 'drizzle-orm'
import { getCurrentUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { subscriptions, reports, findings } from '@/lib/db/schema'
import { authUser } from '@/lib/db/auth-schema'

const PRO_PRICE_GBP = 49

async function assertAdmin() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) notFound()
}

export interface DailySignup {
  date: string
  signups: number
}

export interface RecentSignIn {
  email: string
  createdAt: string
  lastSignIn: string | null
  isPro: boolean
}

export interface AnalyticsData {
  mrr: number
  totalUsers: number
  newSignups30d: number
  proCount: number
  freeCount: number
  activeUsers30d: number
  conversionRate: number
  churn30d: number
  totalReports: number
  reportsByStatus: { draft: number; active: number; final: number }
  totalFindings: number
  avgFindingsPerReport: number
  signupsByDay: DailySignup[]
  recentSignIns: RecentSignIn[]
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  await assertAdmin()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [users, subsRows, reportsRows, findingsCountRows] = await Promise.all([
    db.select({
      id:        authUser.id,
      email:     authUser.email,
      createdAt: authUser.createdAt,
    }).from(authUser),
    db.select({
      userId:    subscriptions.userId,
      status:    subscriptions.status,
      updatedAt: subscriptions.updatedAt,
    }).from(subscriptions),
    db.select({
      userId:    reports.userId,
      createdAt: reports.createdAt,
      status:    reports.status,
    }).from(reports),
    db.select({ value: count() }).from(findings),
  ])

  const subsData = subsRows
  const reportsData = reportsRows
  const totalFindings = findingsCountRows[0]?.value ?? 0

  const activeSubs = subsData.filter(s => s.status === 'active')
  const proUserIds = new Set(activeSubs.map(s => s.userId))
  // Use Set size to deduplicate — guards against duplicate subscription rows from webhook replays
  const proCount = proUserIds.size
  const totalUsers = users.length

  const newSignups30d = users.filter(u => u.createdAt > thirtyDaysAgo).length

  // "Active" = created a report in the window; a proxy for product engagement
  const activeUserIds = new Set(
    reportsData
      .filter(r => new Date(r.createdAt) > thirtyDaysAgo)
      .map(r => r.userId)
  )

  const churn30d = subsData.filter(
    s => (s.status === 'canceled' || s.status === 'paused') &&
         new Date(s.updatedAt) > thirtyDaysAgo
  ).length

  const reportsByStatus = {
    draft:  reportsData.filter(r => r.status === 'draft').length,
    active: reportsData.filter(r => r.status === 'active').length,
    final:  reportsData.filter(r => r.status === 'final').length,
  }

  const totalReports = reportsData.length
  const avgFindingsPerReport = totalReports > 0
    ? Math.round(totalFindings / totalReports)
    : 0

  // better-auth does not track last_sign_in_at, so "recent" is the most recent
  // signups by createdAt; lastSignIn is unavailable and reported as null.
  const recentSignIns: RecentSignIn[] = [...users]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
    .map(u => ({
      email: u.email ?? 'unknown',
      createdAt: u.createdAt.toISOString(),
      lastSignIn: null,
      isPro: proUserIds.has(u.id),
    }))

  return {
    mrr: proCount * PRO_PRICE_GBP,
    totalUsers,
    newSignups30d,
    proCount,
    freeCount: totalUsers - proCount,
    activeUsers30d: activeUserIds.size,
    conversionRate: totalUsers > 0 ? (proCount / totalUsers) * 100 : 0,
    churn30d,
    totalReports,
    reportsByStatus,
    totalFindings,
    avgFindingsPerReport,
    signupsByDay: buildDailySignups(users, 30),
    recentSignIns,
  }
}

function buildDailySignups(users: { createdAt: Date }[], days: number): DailySignup[] {
  const buckets: DailySignup[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    buckets.push({ date: d.toISOString().split('T')[0], signups: 0 })
  }

  for (const user of users) {
    const dateStr = user.createdAt.toISOString().split('T')[0]
    const bucket = buckets.find(b => b.date === dateStr)
    if (bucket) bucket.signups++
  }

  return buckets
}
