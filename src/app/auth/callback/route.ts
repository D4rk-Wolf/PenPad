import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Handles the Supabase email-confirmation and OAuth callback flow.
 *
 * Supabase redirects users here after they click a confirmation link:
 *   <NEXT_PUBLIC_APP_URL>/auth/callback?code=<pkce_code>
 *
 * Requirements:
 *  1. In your Supabase project: Authentication → URL Configuration → Redirect URLs
 *     must include `<NEXT_PUBLIC_APP_URL>/auth/callback`
 *  2. NEXT_PUBLIC_APP_URL must be set in your Vercel environment variables
 *     and must match the Site URL in your Supabase Auth settings.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // `next` allows post-login redirects (e.g. deep links) — defaults to dashboard
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Redirect to the intended destination after successful confirmation
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If no code or exchange failed, redirect to login with an error indicator
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}
