import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockReturning, mockOnConflict, mockValues, mockInsert } = vi.hoisted(() => {
  const mockReturning = vi.fn()
  const mockOnConflict = vi.fn().mockReturnValue({ returning: mockReturning })
  const mockValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflict })
  const mockInsert = vi.fn().mockReturnValue({ values: mockValues })
  return { mockReturning, mockOnConflict, mockValues, mockInsert }
})

vi.mock('@/lib/db', () => ({ db: { insert: mockInsert } }))

import { checkAndIncrementAiUsage } from '@/lib/ai/usage'

describe('checkAndIncrementAiUsage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnConflict.mockReturnValue({ returning: mockReturning })
    mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflict })
    mockInsert.mockReturnValue({ values: mockValues })
  })

  it('passes when the post-increment count is at the limit', async () => {
    mockReturning.mockResolvedValue([{ count: 30 }])
    await expect(checkAndIncrementAiUsage('user-1', 30)).resolves.toBeUndefined()
    expect(mockInsert).toHaveBeenCalledTimes(1)
  })

  it('throws AI_RATE_LIMITED when the post-increment count exceeds the limit', async () => {
    mockReturning.mockResolvedValue([{ count: 31 }])
    await expect(checkAndIncrementAiUsage('user-1', 30)).rejects.toThrow('AI_RATE_LIMITED')
  })

  it('defaults to AI_DAILY_LIMIT (30)', async () => {
    mockReturning.mockResolvedValue([{ count: 31 }])
    await expect(checkAndIncrementAiUsage('user-1')).rejects.toThrow('AI_RATE_LIMITED')
  })
})
