import { describe, it, expect } from 'vitest'
import { FindingSchema, ReportSchema, PasswordSchema } from '@/lib/validations'

// ── FindingSchema ─────────────────────────────────────────────────────────────

describe('FindingSchema', () => {
  const valid = {
    title: 'SQL Injection in login form',
    cvssScore: '9.1',
    description: 'The login endpoint is vulnerable to SQL injection.',
    impact: 'Full database read/write access.',
    recommendation: 'Use parameterised queries.',
    evidence: "' OR 1=1--",
    affectedComponent: '/api/v1/login',
  }

  it('accepts a fully populated valid input', () => {
    expect(FindingSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts minimal input (title + cvssScore only)', () => {
    expect(FindingSchema.safeParse({ title: 'XSS', cvssScore: 6.5 }).success).toBe(true)
  })

  it('rejects an empty title', () => {
    const result = FindingSchema.safeParse({ ...valid, title: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toBe('Title is required')
  })

  it('rejects a title over 500 characters', () => {
    const result = FindingSchema.safeParse({ ...valid, title: 'A'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('rejects cvssScore below 0', () => {
    expect(FindingSchema.safeParse({ ...valid, cvssScore: -0.1 }).success).toBe(false)
  })

  it('rejects cvssScore above 10', () => {
    expect(FindingSchema.safeParse({ ...valid, cvssScore: 10.1 }).success).toBe(false)
  })

  it('coerces cvssScore from string to number', () => {
    const result = FindingSchema.safeParse({ ...valid, cvssScore: '7.5' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.cvssScore).toBe(7.5)
  })

  it('accepts cvssScore of exactly 0 and 10', () => {
    expect(FindingSchema.safeParse({ ...valid, cvssScore: 0 }).success).toBe(true)
    expect(FindingSchema.safeParse({ ...valid, cvssScore: 10 }).success).toBe(true)
  })

  it('rejects evidence over 20,000 characters', () => {
    expect(FindingSchema.safeParse({ ...valid, evidence: 'A'.repeat(20_001) }).success).toBe(false)
  })

  it('rejects description over 20,000 characters', () => {
    expect(FindingSchema.safeParse({ ...valid, description: 'A'.repeat(20_001) }).success).toBe(false)
  })

  it('rejects impact over 10,000 characters', () => {
    expect(FindingSchema.safeParse({ ...valid, impact: 'A'.repeat(10_001) }).success).toBe(false)
  })

  it('accepts null for optional fields', () => {
    expect(FindingSchema.safeParse({ title: 'XSS', cvssScore: 3, description: null, evidence: null }).success).toBe(true)
  })

  it('rejects missing title entirely', () => {
    expect(FindingSchema.safeParse({ cvssScore: 5 }).success).toBe(false)
  })

  it('accepts affectedComponent at exactly 500 characters', () => {
    expect(FindingSchema.safeParse({ ...valid, affectedComponent: 'A'.repeat(500) }).success).toBe(true)
  })

  it('rejects affectedComponent over 500 characters', () => {
    expect(FindingSchema.safeParse({ ...valid, affectedComponent: 'A'.repeat(501) }).success).toBe(false)
  })

  it('accepts recommendation at exactly 10,000 characters', () => {
    expect(FindingSchema.safeParse({ ...valid, recommendation: 'A'.repeat(10_000) }).success).toBe(true)
  })

  it('rejects recommendation over 10,000 characters', () => {
    expect(FindingSchema.safeParse({ ...valid, recommendation: 'A'.repeat(10_001) }).success).toBe(false)
  })

  it('coerces cvssScore from string "0" to number 0', () => {
    const result = FindingSchema.safeParse({ ...valid, cvssScore: '0' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.cvssScore).toBe(0)
  })

  it('coerces cvssScore from string "10.0" to number 10', () => {
    const result = FindingSchema.safeParse({ ...valid, cvssScore: '10.0' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.cvssScore).toBe(10)
  })

  it('rejects non-numeric cvssScore string', () => {
    expect(FindingSchema.safeParse({ ...valid, cvssScore: 'critical' }).success).toBe(false)
  })

  it('accepts all optional fields as undefined', () => {
    expect(FindingSchema.safeParse({ title: 'Test', cvssScore: 5 }).success).toBe(true)
  })
})

// ── ReportSchema ──────────────────────────────────────────────────────────────

describe('ReportSchema', () => {
  const valid = {
    clientName: 'Acme Corp',
    scope: '10.0.0.0/24',
    startDate: '2026-05-01',
    endDate: '2026-05-07',
    testerName: 'Jamie Foster',
  }

  it('accepts a fully populated valid input', () => {
    expect(ReportSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts minimal input (clientName only)', () => {
    expect(ReportSchema.safeParse({ clientName: 'Acme' }).success).toBe(true)
  })

  it('rejects an empty clientName', () => {
    const result = ReportSchema.safeParse({ ...valid, clientName: '' })
    expect(result.success).toBe(false)
  })

  it('rejects clientName over 200 characters', () => {
    expect(ReportSchema.safeParse({ ...valid, clientName: 'A'.repeat(201) }).success).toBe(false)
  })

  it('accepts valid ISO date strings', () => {
    expect(ReportSchema.safeParse({ ...valid, startDate: '2026-01-01', endDate: '2026-12-31' }).success).toBe(true)
  })

  it('rejects non-ISO date format', () => {
    expect(ReportSchema.safeParse({ ...valid, startDate: '01/05/2026' }).success).toBe(false)
    expect(ReportSchema.safeParse({ ...valid, startDate: '2026-5-1' }).success).toBe(false)
    expect(ReportSchema.safeParse({ ...valid, endDate: 'May 7th 2026' }).success).toBe(false)
  })

  it('accepts null for optional date fields', () => {
    expect(ReportSchema.safeParse({ clientName: 'Test', startDate: null, endDate: null }).success).toBe(true)
  })

  it('rejects scope over 5,000 characters', () => {
    expect(ReportSchema.safeParse({ ...valid, scope: 'A'.repeat(5_001) }).success).toBe(false)
  })

  it('accepts scope at exactly 5,000 characters', () => {
    expect(ReportSchema.safeParse({ ...valid, scope: 'A'.repeat(5_000) }).success).toBe(true)
  })

  it('accepts testerName at exactly 200 characters', () => {
    expect(ReportSchema.safeParse({ ...valid, testerName: 'A'.repeat(200) }).success).toBe(true)
  })

  it('rejects testerName over 200 characters', () => {
    expect(ReportSchema.safeParse({ ...valid, testerName: 'A'.repeat(201) }).success).toBe(false)
  })

  it('rejects empty string for startDate (does not match YYYY-MM-DD)', () => {
    expect(ReportSchema.safeParse({ ...valid, startDate: '' }).success).toBe(false)
  })

  it('accepts clientName of exactly 1 character', () => {
    expect(ReportSchema.safeParse({ clientName: 'X' }).success).toBe(true)
  })

  it('accepts clientName at exactly 200 characters', () => {
    expect(ReportSchema.safeParse({ clientName: 'A'.repeat(200) }).success).toBe(true)
  })
})

// ── PasswordSchema ────────────────────────────────────────────────────────────

describe('PasswordSchema', () => {
  it('accepts valid current + new password', () => {
    expect(PasswordSchema.safeParse({ currentPassword: 'oldpass', newPassword: 'newpass1' }).success).toBe(true)
  })

  it('rejects empty currentPassword', () => {
    expect(PasswordSchema.safeParse({ currentPassword: '', newPassword: 'newpass1' }).success).toBe(false)
  })

  it('rejects newPassword shorter than 8 characters', () => {
    const result = PasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('New password must be at least 8 characters')
    }
  })

  it('accepts newPassword of exactly 8 characters', () => {
    expect(PasswordSchema.safeParse({ currentPassword: 'old', newPassword: '12345678' }).success).toBe(true)
  })

  it('rejects newPassword of exactly 7 characters', () => {
    expect(PasswordSchema.safeParse({ currentPassword: 'old', newPassword: '1234567' }).success).toBe(false)
  })

  it('accepts very long passwords (1000 chars)', () => {
    expect(PasswordSchema.safeParse({ currentPassword: 'old', newPassword: 'A'.repeat(1000) }).success).toBe(true)
  })

  it('rejects missing newPassword field entirely', () => {
    expect(PasswordSchema.safeParse({ currentPassword: 'old' }).success).toBe(false)
  })

  it('rejects missing currentPassword field entirely', () => {
    expect(PasswordSchema.safeParse({ newPassword: 'newpassword' }).success).toBe(false)
  })

  it('accepts passwords with special characters', () => {
    expect(PasswordSchema.safeParse({
      currentPassword: 'p@$$w0rd!',
      newPassword: 'N3w-P@$$w0rd!',
    }).success).toBe(true)
  })
})
