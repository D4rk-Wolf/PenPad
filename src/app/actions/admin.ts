import 'server-only'

import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminDb } from '@/lib/supabase/admin'

const PRO_PRICE_GBP = 49

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

  const [usersResult, subsResult, reportsResult, findingsResult] = await Promise.all([
    adminDb().auth.admin.listUsers({ perPage: 1000 }),
    adminDb().from('subscriptions').select('user_id, status, updated_at'),
    adminDb().from('reports').select('user_id, created_at, status'),
    adminDb().from('findings').select('id', { count: 'exact', head: true }),
  ])

  if (usersResult.error) throw new Error(usersResult.error.message)
  if (subsResult.error) throw new Error(subsResult.error.message)
  if (reportsResult.error) throw new Error(reportsResult.error.message)
  if (findingsResult.error) throw new Error(findingsResult.error.message)

  const users = usersResult.data.users
  const subscriptions = subsResult.data ?? []
  const reports = reportsResult.data ?? []
  const totalFindings = findingsResult.count ?? 0

  const activeSubs = subscriptions.filter(s => s.status === 'active')
  const proUserIds = new Set(activeSubs.map(s => s.user_id))
  // Use Set size to deduplicate — guards against duplicate subscription rows from webhook replays
  const proCount = proUserIds.size
  const totalUsers = users.length

  const newSignups30d = users.filter(u => new Date(u.created_at) > thirtyDaysAgo).length

  // "Active" = created a report in the window; a proxy for product engagement
  const activeUserIds = new Set(
    reports
      .filter(r => new Date(r.created_at) > thirtyDaysAgo)
      .map(r => r.user_id)
  )

  const churn30d = subscriptions.filter(
    s => (s.status === 'canceled' || s.status === 'paused') &&
         new Date(s.updated_at) > thirtyDaysAgo
  ).length

  const reportsByStatus = {
    draft:  reports.filter(r => r.status === 'draft').length,
    active: reports.filter(r => r.status === 'active').length,
    final:  reports.filter(r => r.status === 'final').length,
  }

  const totalReports = reports.length
  const avgFindingsPerReport = totalReports > 0
    ? Math.round(totalFindings / totalReports)
    : 0

  const recentSignIns: RecentSignIn[] = users
    .filter(u => u.last_sign_in_at)
    .sort((a, b) => new Date(b.last_sign_in_at!).getTime() - new Date(a.last_sign_in_at!).getTime())
    .slice(0, 10)
    .map(u => ({
      email: u.email ?? 'unknown',
      createdAt: u.created_at,
      lastSignIn: u.last_sign_in_at ?? null,
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

function buildDailySignups(users: { created_at: string }[], days: number): DailySignup[] {
  const buckets: DailySignup[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    buckets.push({ date: d.toISOString().split('T')[0], signups: 0 })
  }

  for (const user of users) {
    const dateStr = new Date(user.created_at).toISOString().split('T')[0]
    const bucket = buckets.find(b => b.date === dateStr)
    if (bucket) bucket.signups++
  }

  return buckets
}
