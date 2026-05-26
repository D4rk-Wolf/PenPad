'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BrandMark } from '@/components/penpad/brand-mark'
import { Icons } from '@/components/penpad/icons'
import { Field } from '@/components/penpad/ui'

type Mode = 'login' | 'signup'

export function AuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/dashboard')
      router.refresh()
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      if (data.session) {
        // Email confirmation disabled — signed in immediately
        router.push('/dashboard')
        router.refresh()
      } else {
        // Email confirmation enabled — prompt user to check inbox
        setEmailSent(true)
      }
    }
  }

  const brandSide = (
    <div className="auth-side">
      <div className="auth-side-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }}>
          <BrandMark size={28} />
          <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.01em', color: '#fff' }}>PenPad</span>
        </div>
        <h2 className="auth-side-headline">
          The reporting workbench for{' '}
          <em>working penetration testers</em>
        </h2>
        <p className="auth-side-footer">
          Log findings. Score with CVSS v3.1. Ship client-ready PDFs.
        </p>
      </div>
    </div>
  )

  if (emailSent) {
    return (
      <div className="auth-shell">
        {brandSide}
        <div className="auth-form-side">
          <div className="auth-form" style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'color-mix(in srgb, var(--accent) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Icons.Check size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <h2>Check your email</h2>
            <p className="auth-form-sub">
              We sent a confirmation link to <strong style={{ color: 'var(--fg)' }}>{email}</strong>.
              Click it to activate your account.
            </p>
            <p style={{ marginTop: '24px', fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>
              Already confirmed?{' '}
              <Link href="/login" style={{ color: 'var(--fg)', fontWeight: 500 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-shell">
      {brandSide}
      <div className="auth-form-side">
        <div className="auth-form">
          <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="auth-form-sub">
            {mode === 'login'
              ? 'Sign in to your PenPad workspace'
              : 'Start shipping better pen test reports today'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="Email address">
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>

            <Field label="Password" hint={mode === 'signup' ? 'At least 8 characters' : undefined}>
              <input
                className="input"
                type="password"
                placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </Field>

            {error && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '10px 12px', borderRadius: 'var(--r-sm)', background: 'color-mix(in srgb, var(--sev-critical) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--sev-critical) 25%, transparent)' }}>
                <Icons.AlertTriangle size={14} style={{ color: 'var(--sev-critical)', flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--sev-critical)' }}>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }} disabled={loading}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>
            {mode === 'login' ? (
              <>Don&apos;t have an account?{' '}<Link href="/signup" style={{ color: 'var(--fg)', fontWeight: 500 }}>Sign up free</Link></>
            ) : (
              <>Already have an account?{' '}<Link href="/login" style={{ color: 'var(--fg)', fontWeight: 500 }}>Sign in</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
