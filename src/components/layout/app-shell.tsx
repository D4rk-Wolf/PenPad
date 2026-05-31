'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandMark } from '@/components/penpad/brand-mark'
import { Icons } from '@/components/penpad/icons'
import { useTheme } from '@/components/theme-provider'

interface AppShellProps {
  user: { email: string; name?: string }
  signOut: () => Promise<void>
  children: React.ReactNode
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Reports', Icon: Icons.Reports },
  { href: '/templates', label: 'Templates', Icon: Icons.Templates },
  { href: '/settings', label: 'Settings', Icon: Icons.Settings },
]

export function AppShell({ user, signOut, children }: AppShellProps) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase()

  const displayName = user.name ?? user.email
  const close = () => setSidebarOpen(false)

  return (
    <div className="app-root">
      <nav className={`sidebar${sidebarOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-brand">
          <Link href="/dashboard" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
            <BrandMark size={22} />
            <span className="sidebar-brand-name">
              <span style={{ color: 'var(--accent)' }}>Pen</span>Pad
            </span>
          </Link>
        </div>

        <div className="nav-list" style={{ flex: 1 }}>
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} onClick={close} className={`nav-item${active ? ' active' : ''}`}>
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </div>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <span className="user-chip-mail">{displayName}</span>
            <button
              className="btn btn-ghost btn-icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{ marginLeft: 'auto', flexShrink: 0 }}
            >
              {theme === 'dark' ? <Icons.Sun size={14} /> : <Icons.Moon size={14} />}
            </button>
          </div>
          <a
            href="mailto:support@penpad.app"
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--fg-muted)', gap: '8px', textDecoration: 'none', marginTop: '4px' }}
          >
            <Icons.HelpCircle size={14} />
            Get help
          </a>
          <form action={signOut} style={{ marginTop: '2px' }}>
            <button type="submit" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--fg-muted)', gap: '8px' }}>
              <Icons.Logout size={14} />
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={close} aria-hidden="true" />
      )}

      <div className="main-pane">
        <div className="mobile-topbar">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen(true)}
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

        {children}
      </div>
    </div>
  )
}
