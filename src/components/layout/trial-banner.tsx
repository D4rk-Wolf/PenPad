import { isSelfHosted } from '@/lib/license'
import { getTrialEndsAt } from '@/lib/subscriptions'
import Link from 'next/link'

export async function TrialBanner() {
  if (isSelfHosted()) return null
  const ends = await getTrialEndsAt()
  if (!ends) return null
  const days = Math.ceil((new Date(ends).getTime() - Date.now()) / 86_400_000)
  if (days > 0) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 text-center">
        {days} day{days === 1 ? '' : 's'} of Pro left — keep PenPad by self-hosting.{' '}
        <Link href="/settings/license" className="underline font-medium">Get Pro</Link>
      </div>
    )
  }
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 text-center">
      Your Pro trial has ended.{' '}
      <Link href="/settings/license" className="underline font-medium">Get PenPad Pro (self-hosted)</Link>
    </div>
  )
}
