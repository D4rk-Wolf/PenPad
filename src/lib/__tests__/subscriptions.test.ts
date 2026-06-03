import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLimit = vi.fn()
const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

vi.mock('@/lib/db', () => ({
  db: { select: mockSelect },
}))

const mockGetCurrentUser = vi.fn()

vi.mock('@/lib/auth/session', () => ({
  getCurrentUser: mockGetCurrentUser,
}))

vi.mock('server-only', () => ({}))

describe('getMySubscription', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    // Re-wire the chain after clearAllMocks
    mockWhere.mockReturnValue({ limit: mockLimit })
    mockFrom.mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })
  })

  it('returns null when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const { getMySubscription } = await import('@/lib/subscriptions')
    const result = await getMySubscription()
    expect(result).toBeNull()
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it('returns null when user has no subscription', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'user-123' })
    mockLimit.mockResolvedValue([])
    const { getMySubscription } = await import('@/lib/subscriptions')
    const result = await getMySubscription()
    expect(result).toBeNull()
  })

  it('returns the subscription when one exists', async () => {
    const fakeSubscription = {
      id: 'sub-1',
      userId: 'user-123',
      stripeCustomerId: 'cus_abc',
      stripeSubscriptionId: 'sub_abc',
      status: 'active',
      currentPeriodEnd: null,
      updatedAt: new Date(),
    }
    mockGetCurrentUser.mockResolvedValue({ id: 'user-123' })
    mockLimit.mockResolvedValue([fakeSubscription])
    const { getMySubscription } = await import('@/lib/subscriptions')
    const result = await getMySubscription()
    expect(result).toEqual(fakeSubscription)
  })
})
