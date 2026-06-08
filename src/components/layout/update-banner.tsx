import { isSelfHosted } from '@/lib/license'
import pkg from '../../../package.json'

async function getLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch('https://penpad.co.uk/api/version', {
      next: { revalidate: 86400 },
    })
    const json = await res.json()
    return typeof json.version === 'string' ? json.version : null
  } catch {
    return null
  }
}

export async function UpdateBanner() {
  if (!isSelfHosted()) return null

  const latestVersion = await getLatestVersion()
  if (!latestVersion || latestVersion === pkg.version) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 text-center">
      PenPad {latestVersion} is available.{' '}
      <a
        href="https://github.com/d4rkwolf/penpad/releases"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-medium"
      >
        See what&apos;s new
      </a>
      {' — '}run{' '}
      <code className="font-mono bg-amber-100 px-1 rounded text-xs">
        docker compose pull &amp;&amp; docker compose up -d
      </code>
      {' '}to update.
    </div>
  )
}
