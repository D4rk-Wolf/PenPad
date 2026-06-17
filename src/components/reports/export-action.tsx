'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Icons } from '@/components/penpad/icons'
import { startProCheckout } from '@/app/actions/billing'
import { captureClient } from '@/lib/analytics/client'

const PRO_BENEFITS = [
  'Client-ready PDF export with CVSS scoring',
  'Your own logo, company name and brand colour',
  'Unlimited reports and reusable finding templates',
  'Runs on your own server (Docker) — your data never leaves your infra',
]

/**
 * Export button for the report header.
 *
 * Pro users get a direct PDF export link. Free users get an in-context upgrade
 * modal (instead of bouncing to /settings or hitting the raw 403), with a single
 * click straight to Stripe Checkout — the highest-intent conversion moment.
 */
export function ExportAction({ reportId, isPro }: { reportId: string; isPro: boolean }) {
  const [open, setOpen] = useState(false)

  if (isPro) {
    return (
      <Link
        href={`/reports/${reportId}/export`}
        target="_blank"
        className="btn btn-outline btn-sm"
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <Icons.Download size={14} />
        Export PDF
      </Link>
    )
  }

  function openUpgrade() {
    setOpen(true)
    captureClient('pdf_export_blocked', { report_id: reportId, source: 'report_export_button' })
  }

  return (
    <>
      <button
        type="button"
        onClick={openUpgrade}
        className="btn btn-outline btn-sm"
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <Icons.Download size={14} />
        Export PDF
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Get PenPad Pro — self-hosted</DialogTitle>
            <DialogDescription>
              PDF export is a Pro feature. Pro runs self-hosted, so your clients&apos; data stays on your own infrastructure. £49/mo, cancel anytime.
            </DialogDescription>
          </DialogHeader>

          <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: 0, padding: 0, listStyle: 'none' }}>
            {PRO_BENEFITS.map((benefit) => (
              <li
                key={benefit}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: 'var(--fs-sm)', color: 'var(--fg-secondary)' }}
              >
                <Icons.Check size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                {benefit}
              </li>
            ))}
          </ul>

          <form action={startProCheckout} style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-outline btn-sm">
              Not now
            </button>
            <button
              type="submit"
              onClick={() => captureClient('upgrade_cta_clicked', { source: 'export_modal' })}
              className="btn btn-accent"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Upgrade to Pro — £49/mo
              <Icons.ArrowRight size={14} />
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
