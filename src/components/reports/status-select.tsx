'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { updateReportStatus } from '@/app/actions/reports'

type ReportStatus = 'draft' | 'active' | 'final'

const STATUSES: { value: ReportStatus; label: string; bg: string; color: string }[] = [
  { value: 'draft',  label: 'Draft',  bg: 'var(--bg-muted)',    color: 'var(--fg-secondary)' },
  { value: 'active', label: 'Active', bg: 'var(--accent-soft)', color: 'var(--accent-soft-fg)' },
  { value: 'final',  label: 'Final',  bg: 'var(--ok-bg)',       color: 'var(--ok)' },
]

export function StatusSelect({
  reportId,
  status,
}: {
  reportId: string
  status: ReportStatus
}) {
  const [isPending, startTransition] = useTransition()

  function handleChange(next: ReportStatus) {
    if (next === status || isPending) return
    startTransition(async () => {
      try {
        await updateReportStatus(reportId, next)
        toast.success(`Marked as ${next}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update status')
      }
    })
  }

  return (
    <div
      role="group"
      aria-label="Report status"
      style={{
        display: 'inline-flex',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        opacity: isPending ? 0.6 : 1,
        transition: 'opacity 0.15s',
        flexShrink: 0,
      }}
    >
      {STATUSES.map(({ value, label, bg, color }, i) => {
        const isCurrent = value === status
        const isLast = i === STATUSES.length - 1
        return (
          <button
            key={value}
            type="button"
            disabled={isPending}
            onClick={() => handleChange(value)}
            aria-pressed={isCurrent}
            style={{
              padding: '3px 11px',
              fontSize: 'var(--fs-xs)',
              fontWeight: isCurrent ? 600 : 400,
              background: isCurrent ? bg : 'transparent',
              color: isCurrent ? color : 'var(--fg-muted)',
              border: 'none',
              borderRight: isLast ? 'none' : '1px solid var(--border)',
              cursor: isPending ? 'not-allowed' : (isCurrent ? 'default' : 'pointer'),
              transition: 'background 0.12s, color 0.12s',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
