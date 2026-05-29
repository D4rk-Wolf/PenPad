import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono, IBM_Plex_Serif } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'PenPad — pen test reports for security professionals',
  description:
    'The reporting workbench for working penetration testers. Log findings, score with CVSS v3.1, and ship client-ready PDF reports.',
}

// Static compile-time constant — never derived from user input, safe for
// dangerouslySetInnerHTML. Inlined to avoid a network round-trip for
// theme-init.js. Runs synchronously before paint → no flash of wrong theme.
// suppressHydrationWarning on <html> prevents a React mismatch when the script
// flips data-theme before hydration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// If the user has an explicit stored preference, honour it.
// Otherwise fall back to the OS prefers-color-scheme setting.
// This runs synchronously before first paint to avoid any flash.
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
        </ThemeProvider>
      </body>
    </html>
  )
}
