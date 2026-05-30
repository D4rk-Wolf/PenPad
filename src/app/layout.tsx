import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono, IBM_Plex_Serif } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-serif',
  display: 'swap',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pen-pad.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'PenPad — Penetration Testing Report Software',
    template: '%s | PenPad',
  },
  description:
    'The penetration testing report tool built for working pentesters. Log findings, auto-score with CVSS v3.1, and export client-ready PDF reports. Free to start.',
  keywords: [
    'penetration testing report',
    'pentest report tool',
    'pentest report software',
    'pentest report template',
    'CVSS scoring tool',
    'vulnerability report software',
    'security assessment report',
    'pentest PDF export',
    'penetration testing software',
  ],
  authors: [{ name: 'D4rkWolf Studios', url: 'https://d4rkwolf.co.uk' }],
  creator: 'D4rkWolf Studios',
  publisher: 'D4rkWolf Studios',
  openGraph: {
    type: 'website',
    siteName: 'PenPad',
    title: 'PenPad — Penetration Testing Report Software',
    description:
      'Log findings, score with CVSS v3.1, and ship client-ready PDF reports. The report tool built for working penetration testers.',
    url: '/',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'PenPad — Penetration Testing Report Software' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PenPad — Penetration Testing Report Software',
    description:
      'Log findings, score with CVSS v3.1, and ship client-ready PDF reports. Built for working penetration testers.',
    images: ['/opengraph-image'],
  },
  robots: { index: true, follow: true },
}

// Static compile-time constant — never derived from user input, safe for
// dangerouslySetInnerHTML. Inlined to avoid a network round-trip for
// theme-init.js. Runs synchronously before paint → no flash of wrong theme.
// suppressHydrationWarning on <html> prevents a React mismatch when the script
// flips data-theme before hydration. Honours stored preference, falls back to
// prefers-color-scheme.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const THEME_SCRIPT: any = `(function(){var s=localStorage.getItem('penpad-theme');var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);})()`

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${ibmPlexSerif.variable}`}
    >
      <head>
        {/* Runs synchronously before paint — applies stored theme without flash */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" richColors />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
