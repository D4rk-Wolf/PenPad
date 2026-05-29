import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/database.types'

type AdminClient = ReturnType<typeof createClient<Database>>

let _client: AdminClient | null = null

export function adminDb(): AdminClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Missing Supabase admin env vars')
    _client = createClient<Database>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }
  return _client
}

// Hoisted to module scope so they are compiled once, not on every camel() call
const SNAKE_RE   = /_([a-z])/g
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T/

export function camel<T>(row: Record<string, unknown>): T {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k.replace(SNAKE_RE, (_, c: string) => c.toUpperCase()),
      typeof v === 'string' && ISO_DATE_RE.test(v) ? new Date(v) : v,
    ])
  ) as T
}
