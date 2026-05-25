'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { MobileHeader } from './mobile-header'

interface AppShellProps {
  user: { email: string }
  signOut: () => Promise<void>
  children: React.ReactNode
}

export function AppShell({ user, signOut, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-muted overflow-hidden">
      <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar
        user={user}
        signOut={signOut}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
