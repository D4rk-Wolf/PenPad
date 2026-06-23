import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockRequireUser, mockGetSub, mockIsSelfHosted,
  mockIsAiConfigured, mockDraftFinding, mockCheckAndIncrement,
} = vi.hoisted(() => ({
  mockRequireUser: vi.fn(),
  mockGetSub: vi.fn(),
  mockIsSelfHosted: vi.fn(),
  mockIsAiConfigured: vi.fn(),
  mockDraftFinding: vi.fn(),
  mockCheckAndIncrement: vi.fn(),
}))

vi.mock('@/lib/auth/session', () => ({ requireUser: mockRequireUser }))
vi.mock('@/lib/subscriptions', () => ({ getMySubscription: mockGetSub }))
vi.mock('@/lib/license', () => ({ isSelfHosted: mockIsSelfHosted }))
vi.mock('@/lib/ai/draft', () => ({ isAiConfigured: mockIsAiConfigured, draftFinding: mockDraftFinding }))
vi.mock('@/lib/ai/usage', () => ({ checkAndIncrementAiUsage: mockCheckAndIncrement }))

import { draftFinding } from '@/app/actions/ai'

const DRAFT = { description: 'd', impact: 'i', recommendation: 'r' }

describe('draftFinding action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireUser.mockResolvedValue({ id: 'user-1' })
    mockGetSub.mockResolvedValue({ status: 'active' })
    mockIsSelfHosted.mockReturnValue(false)
    mockIsAiConfigured.mockReturnValue(true)
    mockDraftFinding.mockResolvedValue(DRAFT)
    mockCheckAndIncrement.mockResolvedValue(undefined)
  })

  it('returns the draft for an active cloud user (rate-limit checked)', async () => {
    const result = await draftFinding({ title: 'SQLi' })
    expect(result).toEqual(DRAFT)
    expect(mockCheckAndIncrement).toHaveBeenCalledWith('user-1')
    expect(mockDraftFinding).toHaveBeenCalledWith({ title: 'SQLi', affectedComponent: null, notes: null })
  })

  it('rejects a non-Pro user before drafting', async () => {
    mockGetSub.mockResolvedValue({ status: 'inactive' })
    await expect(draftFinding({ title: 'SQLi' })).rejects.toThrow(/Pro/)
    expect(mockDraftFinding).not.toHaveBeenCalled()
  })

  it('skips the rate limit on self-hosted', async () => {
    mockIsSelfHosted.mockReturnValue(true)
    await draftFinding({ title: 'SQLi' })
    expect(mockCheckAndIncrement).not.toHaveBeenCalled()
    expect(mockDraftFinding).toHaveBeenCalled()
  })

  it('maps AI_RATE_LIMITED to a friendly message', async () => {
    mockCheckAndIncrement.mockRejectedValue(new Error('AI_RATE_LIMITED'))
    await expect(draftFinding({ title: 'SQLi' })).rejects.toThrow(/today's AI limit/)
    expect(mockDraftFinding).not.toHaveBeenCalled()
  })

  it('rethrows a non-rate-limit limiter error unchanged (not mapped to the limit message)', async () => {
    mockCheckAndIncrement.mockRejectedValue(new Error('DB unavailable'))
    await expect(draftFinding({ title: 'SQLi' })).rejects.toThrow('DB unavailable')
    expect(mockDraftFinding).not.toHaveBeenCalled()
  })

  it('throws when AI is not configured', async () => {
    mockIsAiConfigured.mockReturnValue(false)
    await expect(draftFinding({ title: 'SQLi' })).rejects.toThrow(/not configured/)
    expect(mockDraftFinding).not.toHaveBeenCalled()
  })

  it('rejects an empty title (validation)', async () => {
    await expect(draftFinding({ title: '' })).rejects.toThrow(/Title is required/)
  })
})
