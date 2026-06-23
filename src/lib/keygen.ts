import 'server-only'

const ACCOUNT = process.env.KEYGEN_ACCOUNT_ID ?? ''
const TOKEN = process.env.KEYGEN_API_TOKEN ?? ''
const POLICY = process.env.KEYGEN_POLICY_ID ?? ''
const BASE = `https://api.keygen.sh/v1/accounts/${ACCOUNT}`

function configured(): boolean {
  return Boolean(ACCOUNT && TOKEN && POLICY)
}

async function admin(path: string, body: unknown): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(body),
  })
}

export async function createProLicense(
  { email, stripeCustomerId, userId }: { email: string; stripeCustomerId: string; userId: string },
): Promise<{ licenseId: string; licenseKey: string } | null> {
  if (!configured()) {
    console.warn('[keygen] not configured — skipping license creation')
    return null
  }
  const res = await admin('/licenses', {
    data: {
      type: 'licenses',
      attributes: { metadata: { tier: 'pro', email, stripeCustomerId, userId } },
      relationships: { policy: { data: { type: 'policies', id: POLICY } } },
    },
  })
  if (!res.ok) {
    console.error('[keygen] createProLicense failed:', res.status, await res.text())
    return null
  }
  const json = await res.json()
  const licenseId = json?.data?.id
  const licenseKey = json?.data?.attributes?.key
  if (!licenseId || !licenseKey) return null
  return { licenseId, licenseKey }
}

export async function suspendLicense(licenseId: string): Promise<void> {
  if (!configured() || !licenseId) return
  const res = await admin(`/licenses/${licenseId}/actions/suspend`, {})
  if (!res.ok) console.error('[keygen] suspend failed:', res.status, await res.text())
}

export async function reinstateLicense(licenseId: string): Promise<void> {
  if (!configured() || !licenseId) return
  const res = await admin(`/licenses/${licenseId}/actions/reinstate`, {})
  if (!res.ok) console.error('[keygen] reinstate failed:', res.status, await res.text())
}
