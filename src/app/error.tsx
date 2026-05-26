'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/error]', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'color-mix(in srgb, var(--sev-critical) 12%, transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '20px',
        }}>
          ⚠
        </div>
        <h1 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--fg)', marginBottom: '8px' }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
          An unexpected error occurred. If this keeps happening, contact support.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button className="btn btn-accent btn-sm" onClick={reset}>Try again</button>
          <Link href="/dashboard" className="btn btn-outline btn-sm">Go to dashboard</Link>
        </div>
        {error.digest && (
          <p style={{ marginTop: '16px', fontSize: 'var(--fs-xs)', color: 'var(--fg-subtle)', fontFamily: 'var(--font-mono)' }}>
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
