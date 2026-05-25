import { describe, it, expect } from 'vitest'
import { CURATED_TEMPLATES, type CuratedTemplate } from '@/lib/templates'
import { deriveSeverity } from '@/lib/utils'

describe('CURATED_TEMPLATES', () => {
  it('has exactly 20 entries', () => {
    expect(CURATED_TEMPLATES).toHaveLength(20)
  })

  it('every entry has required string fields', () => {
    for (const t of CURATED_TEMPLATES) {
      expect(typeof t.title).toBe('string')
      expect(t.title.length).toBeGreaterThan(0)
      expect(typeof t.description).toBe('string')
      expect(typeof t.impact).toBe('string')
      expect(typeof t.recommendation).toBe('string')
    }
  })

  it('every cvssScore is between 0 and 10', () => {
    for (const t of CURATED_TEMPLATES) {
      expect(t.cvssScore).toBeGreaterThanOrEqual(0)
      expect(t.cvssScore).toBeLessThanOrEqual(10)
    }
  })

  it('severity matches deriveSeverity(cvssScore) for every entry', () => {
    for (const t of CURATED_TEMPLATES) {
      expect(t.severity).toBe(deriveSeverity(t.cvssScore))
    }
  })

  it('category is one of the three allowed values', () => {
    const allowed = ['OWASP Web', 'OWASP API', 'Infrastructure']
    for (const t of CURATED_TEMPLATES) {
      expect(allowed).toContain(t.category)
    }
  })

  it('has 10 OWASP Web, 5 OWASP API, and 5 Infrastructure entries', () => {
    const counts = CURATED_TEMPLATES.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1
      return acc
    }, {})
    expect(counts['OWASP Web']).toBe(10)
    expect(counts['OWASP API']).toBe(5)
    expect(counts['Infrastructure']).toBe(5)
  })
})
