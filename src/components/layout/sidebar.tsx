'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, BookOpen, Settings, Sun, Moon, Monitor, X } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: { email: string }
  signOut: () => Promise<void>
  open?: boolean
  onClose?: () => void
}

const navLinks = [
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/templates', label: 'Templates', icon: BookOpen },
]

export function Sidebar({ user, signOut, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { mode, toggleTheme } = useTheme()
  const initial = user.email[0].toUpperCase()

  return (
    <>
      {open !== undefined && (
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity',
            open ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col bg-background border-r border-border',
          'transition-transform duration-200',
          open !== undefined && !open && '-translate-x-full md:translate-x-0',
          'md:relative md:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-bold tracking-tight">PenPad</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="md:hidden text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                  active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}

          <div className="pt-3 pb-1 px-2.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</span>
          </div>

          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
              pathname.startsWith('/settings')
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Settings
          </Link>
        </nav>

        <div className="px-3 py-3 border-t border-border space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {initial}
            </div>
            <span className="text-xs text-muted-foreground truncate flex-1">{user.email}</span>
            <button
              onClick={toggleTheme}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={mode === 'system' ? 'Theme: following system' : mode === 'light' ? 'Theme: light' : 'Theme: dark'}
              title={mode === 'system' ? 'Following system — click to set light' : mode === 'light' ? 'Light — click to set dark' : 'Dark — click to follow system'}
            >
              {mode === 'system'
                ? <Monitor className="w-4 h-4" />
                : mode === 'light'
                  ? <Moon className="w-4 h-4" />
                  : <Sun className="w-4 h-4" />}
            </button>
          </div>
          <form action={signOut}>
            <button type="submit" className="w-full text-left text-xs text-muted-foreground hover:text-foreground py-0.5">
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
