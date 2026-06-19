import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import { MAX_CAPTION_LEN } from '@/lib/images'

// ---------------------------------------------------------------------------
// Hoisted mocks — must be declared before any imports of the modules under
// test so vi.mock factory closures can reference them.
// ---------------------------------------------------------------------------
const {
  mockLimit,
  mockWhere,
  mockInnerJoin,
  mockFrom,
  mockSelect,
  mockRequireUser,
  mockRevalidatePath,
} = vi.hoisted(() => {
  const mockLimit      = vi.fn()
  const mockWhere      = vi.fn().mockReturnValue({ limit: mockLimit })
  const mockInnerJoin  = vi.fn().mockReturnValue({ where: mockWhere })
  const mockFrom       = vi.fn().mockReturnValue({ where: mockWhere, innerJoin: mockInnerJoin })
  const mockSelect     = vi.fn().mockReturnValue({ from: mockFrom })
  const mockRequireUser    = vi.fn()
  const mockRevalidatePath = vi.fn()
  return { mockLimit, mockWhere, mockInnerJoin, mockFrom, mockSelect, mockRequireUser, mockRevalidatePath }
})

vi.mock('@/lib/db', () => ({
  db: { select: mockSelect },
}))

vi.mock('@/lib/auth/session', () => ({
  requireUser: mockRequireUser,
}))

vi.mock('next/cache', () => ({
  revalidatePath: mockRevalidatePath,
}))

// Import after mocks are wired up.
import { assertFindingOwner } from '@/app/actions/finding-images'

// ---------------------------------------------------------------------------

describe('assertFindingOwner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-wire the chain after clearAllMocks resets return values.
    mockLimit.mockResolvedValue([])
    mockWhere.mockReturnValue({ limit: mockLimit })
    mockInnerJoin.mockReturnValue({ where: mockWhere })
    mockFrom.mockReturnValue({ where: mockWhere, innerJoin: mockInnerJoin })
    mockSelect.mockReturnValue({ from: mockFrom })
  })

  it('throws "Finding not found" when the db returns no matching row', async () => {
    mockRequireUser.mockResolvedValue({ id: 'user-abc' })
    mockLimit.mockResolvedValue([]) // empty → no ownership match

    await expect(assertFindingOwner('finding-uuid')).rejects.toThrow('Finding not found')
  })

  it('returns userId + reportId when the row exists', async () => {
    mockRequireUser.mockResolvedValue({ id: 'user-abc' })
    mockLimit.mockResolvedValue([{ reportId: 'report-xyz' }])

    const result = await assertFindingOwner('finding-uuid')
    expect(result).toEqual({ userId: 'user-abc', reportId: 'report-xyz' })
  })
})

// ---------------------------------------------------------------------------
// Caption validation — test Zod schema directly without a live DB.
// ---------------------------------------------------------------------------
describe('caption length validation', () => {
  const CaptionSchema = z.string().max(MAX_CAPTION_LEN)

  it('accepts a caption at exactly MAX_CAPTION_LEN characters', () => {
    const ok = 'a'.repeat(MAX_CAPTION_LEN)
    expect(() => CaptionSchema.parse(ok)).not.toThrow()
  })

  it('rejects a caption that exceeds MAX_CAPTION_LEN (301 chars)', () => {
    const tooLong = 'a'.repeat(MAX_CAPTION_LEN + 1)
    expect(() => CaptionSchema.parse(tooLong)).toThrow()
  })
})
