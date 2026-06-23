'use server'

import { requireUser } from '@/lib/auth/session'
import { getMySubscription } from '@/lib/subscriptions'
import { isSelfHosted } from '@/lib/license'
import { isAiConfigured, draftFinding as draftFindingAI } from '@/lib/ai/draft'
import type { DraftOutput } from '@/lib/ai/draft'
import { checkAndIncrementAiUsage } from '@/lib/ai/usage'
import { AI_DAILY_LIMIT } from '@/lib/ai/limits'
import { AiDraftSchema } from '@/lib/validations'

export async function draftFinding(input: {
  title: string
  affectedComponent?: string | null
  notes?: string | null
}): Promise<DraftOutput> {
  const user = await requireUser()

  const sub = await getMySubscription()
  if (sub?.status !== 'active') throw new Error('AI drafting is a Pro feature.')

  // Validate before spending an API call.
  const parsed = AiDraftSchema.safeParse(input)
  if (!parsed.success) throw new Error(parsed.error.issues.map(i => i.message).join('; '))
  const d = parsed.data

  // Cloud trial: rate-limit on PenPad's key. Self-hosted uses the customer's key.
  if (!isSelfHosted()) {
    try {
      await checkAndIncrementAiUsage(user.id)
    } catch (err) {
      if (err instanceof Error && err.message === 'AI_RATE_LIMITED') {
        throw new Error(`You've hit today's AI limit (${AI_DAILY_LIMIT}). Try again tomorrow.`)
      }
      throw err
    }
  }

  if (!isAiConfigured()) throw new Error('AI drafting is not configured.')

  try {
    return await draftFindingAI({
      title: d.title,
      affectedComponent: d.affectedComponent ?? null,
      notes: d.notes ?? null,
    })
  } catch {
    throw new Error('AI drafting failed — please try again.')
  }
}
