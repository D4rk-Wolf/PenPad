import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockLimit, mockWhere, mockFrom, mockSelect, mockGetCurrentUser } = vi.hoisted(() => {
  const mockLimit = vi.fn()
  const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit })
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere })
  const mockSelect = vi.fn().mockReturnValue({ from: mockFrom })
  const mockGetCurrentUser = vi.fn()
  return { mockLimit, mockWhere, mockFrom, mockSelect, mockGetCurrentUser }
})

vi.mock('@/lib/db', () => ({
  db: { select: mockSelect },
}))

vi.mock('@/lib/auth/session', () => ({
  getCurrentUser: mockGetCurrentUser,
}))


import { getMySubscription } from '@/lib/subscriptions'

describe('getMySubscription (cloud)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWhere.mockReturnValue({ limit: mockLimit })
    mockFrom.mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })
  })

  it('returns null when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const result = await getMySubscription()
    expect(result).toBeNull()
    expect(mockSelect).not.toHaveBeenCalled()
  })

  it('returns inactive cloud sub when trialEndsAt is null (no row)', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'user-123' })
    mockLimit.mockResolvedValue([])
    const result = await getMySubscription()
    expect(result).toMatchObject({
      id: 'cloud',
      userId: 'user-123',
      status: 'inactive',
    })
  })

  it('returns inactive cloud sub when trialEndsAt is in the past', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'user-123' })
    mockLimit.mockResolvedValue([{ trialEndsAt: new Date(Date.now() - 86_400_000) }])
    const result = await getMySubscription()
    expect(result).toMatchObject({
      id: 'cloud',
      userId: 'user-123',
      status: 'inactive',
    })
  })

  it('returns active cloud sub when trialEndsAt is in the future', async () => {
    const future = new Date(Date.now() + 86_400_000)
    mockGetCurrentUser.mockResolvedValue({ id: 'user-123' })
    mockLimit.mockResolvedValue([{ trialEndsAt: future }])
    const result = await getMySubscription()
    expect(result).toMatchObject({
      id: 'cloud',
      userId: 'user-123',
      status: 'active',
      currentPeriodEnd: future,
    })
  })
})
