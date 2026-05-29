import { describe, it, expect } from 'vitest'
import { cn, deriveSeverity, FREE_REPORT_LIMIT, FREE_FINDING_LIMIT } from '@/lib/utils'

// ── deriveSeverity ────────────────────────────────────────────────────────────

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

  // Exact boundary conditions — off-by-one bugs live here
  it('returns high not critical at exactly 8.99', () => {
    expect(deriveSeverity(8.99)).toBe('high')
  })
  it('returns medium not high at exactly 6.99', () => {
    expect(deriveSeverity(6.99)).toBe('medium')
  })
  it('returns low not medium at exactly 3.99', () => {
    expect(deriveSeverity(3.99)).toBe('low')
  })
  it('returns info for negative scores (not a valid CVSS value but defensively handled)', () => {
    expect(deriveSeverity(-1)).toBe('info')
  })
})

// ── cn ────────────────────────────────────────────────────────────────────────

describe('cn', () => {
  it('joins two simple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('omits falsy values', () => {
    expect(cn('foo', false && 'bar', null, undefined, 'baz')).toBe('foo baz')
  })

  it('handles conditional object syntax', () => {
    expect(cn({ active: true, hidden: false })).toBe('active')
  })

  it('merges conflicting Tailwind classes (last wins)', () => {
    // tailwind-merge: px-2 and px-4 conflict — last one wins
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('')
  })
})

// ── Free-tier limits ──────────────────────────────────────────────────────────

describe('free-tier limit constants', () => {
  it('FREE_REPORT_LIMIT is 3', () => {
    expect(FREE_REPORT_LIMIT).toBe(3)
  })

  it('FREE_FINDING_LIMIT is 10', () => {
    expect(FREE_FINDING_LIMIT).toBe(10)
  })

  it('FREE_FINDING_LIMIT is greater than FREE_REPORT_LIMIT', () => {
    // Sanity: per-report limit should exceed per-account report limit
    expect(FREE_FINDING_LIMIT).toBeGreaterThan(FREE_REPORT_LIMIT)
  })
})
