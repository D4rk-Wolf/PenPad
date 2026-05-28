import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",   // 'unsafe-inline' required by Next.js inline scripts
      "style-src 'self' 'unsafe-inline'",    // required for CSS-in-JS / inline styles
      "img-src 'self' data: blob:",
      "font-src 'self'",
      // Sentry event ingestion added alongside Supabase realtime WebSockets
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://*.ingest.sentry.io",
      // Session Replay builds a Web Worker from a blob: URL
      "worker-src blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        process.env.NEXT_PUBLIC_APP_URL ?? '',
      ].filter(Boolean),
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "d4rkwolf-o6",
  project: "penpad",

  // Silences the Sentry CLI output during builds — errors still surface
  silent: !process.env.CI,

  // Upload source maps to Sentry for readable production stack traces.
  // Requires SENTRY_AUTH_TOKEN in the build environment.
  // Generate a token at: https://d4rkwolf-o6.sentry.io/settings/auth-tokens/
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Tree-shake Sentry debug code from production bundles
  disableLogger: true,

  // Automatically instrument Next.js server components and API routes
  autoInstrumentServerFunctions: true,
});
