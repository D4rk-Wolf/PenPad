import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubEnv('KEYGEN_ACCOUNT_ID', 'acct-test')
  vi.stubEnv('KEYGEN_API_TOKEN', 'tok-test')
  vi.stubEnv('KEYGEN_POLICY_ID', 'pol-test')
})

it('createProLicense returns id + key on success', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(
    JSON.stringify({ data: { id: 'lic_1', attributes: { key: 'KEY-123' } } }),
    { status: 201, headers: { 'Content-Type': 'application/vnd.api+json' } },
  )))
  vi.resetModules()
  const { createProLicense } = await import('@/lib/keygen')
  const res = await createProLicense({ email: 'a@b.co', stripeCustomerId: 'cus_1', userId: 'u1' })
  expect(res).toEqual({ licenseId: 'lic_1', licenseKey: 'KEY-123' })
})

it('createProLicense returns null when unconfigured', async () => {
  vi.stubEnv('KEYGEN_API_TOKEN', '')
  vi.resetModules()
  const { createProLicense } = await import('@/lib/keygen')
  expect(await createProLicense({ email: 'a@b.co', stripeCustomerId: 'c', userId: 'u' })).toBeNull()
})
