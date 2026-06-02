import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockLimit = vi.fn()
const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })

vi.mock('@/lib/db', () => ({
  db: { select: mockSelect },
}))

const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
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
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { getMySubscription } = await import('@/lib/subscriptions')
    const result = await getMySubscription()
    expect(result).toBeNull()
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it('returns null when user has no subscription', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
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
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockLimit.mockResolvedValue([fakeSubscription])
    const { getMySubscription } = await import('@/lib/subscriptions')
    const result = await getMySubscription()
    expect(result).toEqual(fakeSubscription)
  })
})
