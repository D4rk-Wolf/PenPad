'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global-error]', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{
        margin: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        background: '#0d0d0f',
        color: '#e8e8ea',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            PenPad is unavailable
          </h1>
          <p style={{ fontSize: '14px', color: '#888', marginBottom: '24px', lineHeight: 1.5 }}>
            A critical error occurred. Please try again or contact support if the issue persists.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              background: '#5b4cdb',
              color: '#fff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ marginTop: '16px', fontSize: '11px', color: '#555', fontFamily: 'monospace' }}>
              {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
