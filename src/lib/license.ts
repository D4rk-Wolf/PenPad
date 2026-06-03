import 'server-only'

interface LicenseStatus {
  valid: boolean
  tier: 'free' | 'pro'
  code: string
}

const KEYGEN_ACCOUNT_ID = process.env.KEYGEN_ACCOUNT_ID ?? ''

export async function validateLicense(key: string): Promise<LicenseStatus> {
  if (!KEYGEN_ACCOUNT_ID) return { valid: false, tier: 'free', code: 'NO_ACCOUNT' }

  const res = await fetch(
    `https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses/actions/validate-key`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: JSON.stringify({ meta: { key } }),
      next: { revalidate: 3600 },
    }
  )
  const json = await res.json()
  return {
    valid: json.meta?.valid === true,
    tier:  json.data?.attributes?.metadata?.tier === 'pro' ? 'pro' : 'free',
    code:  json.meta?.code ?? 'UNKNOWN',
  }
}

export async function getLicenseStatus(): Promise<LicenseStatus> {
  const key = process.env.PENPAD_LICENSE_KEY
  if (!key) return { valid: false, tier: 'free', code: 'NO_KEY' }
  return validateLicense(key)
}

export function isSelfHosted(): boolean {
  return Boolean(process.env.PENPAD_LICENSE_KEY)
}
