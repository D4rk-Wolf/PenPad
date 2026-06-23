import 'server-only'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { aiUsage } from '@/lib/db/schema'
import { AI_DAILY_LIMIT } from './limits'

/**
 * Atomically increment today's AI-draft count for a user and reject when it
 * exceeds `limit`. Cloud-only — self-hosted deployments use the customer's own
 * key and are not rate-limited. Throws Error('AI_RATE_LIMITED') when over cap.
 */
export async function checkAndIncrementAiUsage(
  userId: string,
  limit: number = AI_DAILY_LIMIT,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)

  const [row] = await db
    .insert(aiUsage)
    .values({ userId, usageDate: today, count: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.usageDate],
      set: { count: sql`${aiUsage.count} + 1` },
    })
    .returning({ count: aiUsage.count })

  if ((row?.count ?? 0) > limit) throw new Error('AI_RATE_LIMITED')
}
