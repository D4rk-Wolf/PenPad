import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

/**
 * Sentry connectivity test endpoint.
 *
 * Sends a controlled test exception to Sentry to verify the DSN, auth token,
 * and event pipeline are all wired up correctly.
 *
 * Protected by SENTRY_TEST_TOKEN — set a random secret in your env vars.
 * Only callable with: GET /api/sentry-test?token=<SENTRY_TEST_TOKEN>
 *
 * Safe to leave in production — unauthenticated requests are rejected.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const expected = process.env.SENTRY_TEST_TOKEN

  if (!expected) {
    return NextResponse.json(
      { error: 'SENTRY_TEST_TOKEN env var not set — add it to your .env.local' },
      { status: 503 },
    )
  }

  if (!token || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) {
    return NextResponse.json(
      { error: 'NEXT_PUBLIC_SENTRY_DSN is not set — Sentry is not configured' },
      { status: 503 },
    )
  }

  // Capture a controlled test exception and flush before the serverless fn exits
  const eventId = Sentry.captureException(
    new Error('[PenPad] Sentry connectivity test — this is intentional, not a real error'),
    {
      tags: { test: 'true', environment: process.env.NODE_ENV ?? 'unknown' },
      extra: { triggeredBy: 'sentry-test endpoint', timestamp: new Date().toISOString() },
    },
  )

  await Sentry.flush(3000)

  return NextResponse.json({
    ok: true,
    eventId,
    dsn: dsn.replace(/\/\/[^@]+@/, '//[credentials]@'), // redact secret portion
    message: 'Test event sent — check your Sentry project Issues tab',
  })
}
