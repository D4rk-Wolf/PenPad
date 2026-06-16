import { describe, it, expect } from 'vitest'
import { isProFromTrial } from '@/lib/entitlement'

describe('isProFromTrial', () => {
  it('is Pro when trial_ends_at is in the future', () => {
    expect(isProFromTrial(new Date(Date.now() + 86_400_000))).toBe(true)
  })
  it('is not Pro when trial_ends_at is in the past', () => {
    expect(isProFromTrial(new Date(Date.now() - 86_400_000))).toBe(false)
  })
  it('is not Pro when trial_ends_at is null', () => {
    expect(isProFromTrial(null)).toBe(false)
  })
})
