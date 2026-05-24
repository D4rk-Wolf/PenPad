import { describe, it, expect } from 'vitest'
import { deriveSeverity } from '@/lib/utils'

describe('deriveSeverity', () => {
  it('returns critical for score >= 9.0', () => {
    expect(deriveSeverity(9.0)).toBe('critical')
    expect(deriveSeverity(10.0)).toBe('critical')
  })
  it('returns high for score >= 7.0', () => {
    expect(deriveSeverity(7.0)).toBe('high')
    expect(deriveSeverity(8.9)).toBe('high')
  })
  it('returns medium for score >= 4.0', () => {
    expect(deriveSeverity(4.0)).toBe('medium')
    expect(deriveSeverity(6.9)).toBe('medium')
  })
  it('returns low for score >= 0.1', () => {
    expect(deriveSeverity(0.1)).toBe('low')
    expect(deriveSeverity(3.9)).toBe('low')
  })
  it('returns info for score 0.0', () => {
    expect(deriveSeverity(0.0)).toBe('info')
  })
})
