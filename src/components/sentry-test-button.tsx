'use client'

import * as Sentry from '@sentry/nextjs'
import { useState } from 'react'

export function SentryTestButton() {
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle')

  function triggerClientError() {
    try {
      const eventId = Sentry.captureException(
        new Error('[PenPad] Client-side Sentry connectivity test — intentional, not a real error'),
        { tags: { test: 'true', side: 'client' } },
      )
      setStatus('sent')
      console.info('[Sentry test] event sent:', eventId)
    } catch {
      setStatus('error')
    }
  }

  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={triggerClientError}
      style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}
    >
      {status === 'idle' && 'Send test error to Sentry'}
      {status === 'sent' && 'Event sent — check Sentry Issues ✓'}
      {status === 'error' && 'Failed — check console'}
    </button>
  )
}
