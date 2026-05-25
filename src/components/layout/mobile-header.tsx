'use client'

import { Menu } from 'lucide-react'

interface MobileHeaderProps {
  onMenuClick: () => void
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="md:hidden flex items-center justify-between px-4 h-12 bg-background border-b border-border shrink-0">
      <button
        onClick={onMenuClick}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-sm font-bold tracking-tight">PenPad</span>
      </div>
      <div className="w-5" />
    </header>
  )
}
