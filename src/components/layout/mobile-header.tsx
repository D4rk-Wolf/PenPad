'use client'

import Link from 'next/link'
import { BrandMark } from '@/components/penpad/brand-mark'
import { Icons } from '@/components/penpad/icons'

interface MobileHeaderProps {
  onMenuClick: () => void
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <div className="mobile-topbar">
      <button
        className="btn btn-ghost btn-icon"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Icons.Menu size={18} />
      </button>
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit', flex: 1, justifyContent: 'center' }}>
        <BrandMark size={20} />
        <span style={{ fontWeight: 600, fontSize: '14px', letterSpacing: '-0.01em' }}>
          <span style={{ color: 'var(--accent)' }}>Pen</span>Pad
        </span>
      </Link>
      <div style={{ width: 32 }} />
    </div>
  )
}
