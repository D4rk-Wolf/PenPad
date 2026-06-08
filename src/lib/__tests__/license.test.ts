import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.hoisted(() => vi.fn())
vi.stubGlobal('fetch', mockFetch)

// validateLicense short-circuits without an account id, so provide one for the
// tests that exercise the fetch path.
vi.stubEnv('KEYGEN_ACCOUNT_ID', 'acct-test')

describe('validateLicense', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns valid:true for an active pro license', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        meta: { valid: true, code: 'VALID' },
        data: { attributes: { metadata: { tier: 'pro' } } },
      }),
    })
    const { validateLicense } = await import('@/lib/license')
    const result = await validateLicense('KEY-TEST-1234')
    expect(result.valid).toBe(true)
    expect(result.tier).toBe('pro')
  })

  it('returns valid:false for an expired license', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ meta: { valid: false, code: 'EXPIRED' }, data: null }),
    })
    const { validateLicense } = await import('@/lib/license')
    const result = await validateLicense('KEY-EXPIRED')
    expect(result.valid).toBe(false)
    expect(result.tier).toBe('free')
  })
})
