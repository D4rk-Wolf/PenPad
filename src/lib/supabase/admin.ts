import { createClient } from '@supabase/supabase-js'

let _client: ReturnType<typeof createClient> | null = null

function getClient() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Missing Supabase admin env vars')
    _client = createClient(url, key)
  }
  return _client
}

export const adminDb = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return getClient()[prop as keyof ReturnType<typeof createClient>]
  },
})

export function camel<T>(row: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()),
      typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v) ? new Date(v) : v,
    ])
  ) as T
}
