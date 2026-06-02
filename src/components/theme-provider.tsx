'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode
}

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  const s = localStorage.getItem('penpad-theme')
  return s === 'light' || s === 'dark' ? s : 'system'
}

const ThemeContext = createContext<{
  mode: ThemeMode
  theme: ResolvedTheme
  setMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}>({
  mode: 'system',
  theme: 'light',
  setMode: () => {},
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always initialize with static values so the server render and the initial
  // client hydration render produce identical trees. The inline <script> in
  // layout.tsx handles preventing a visual flash by setting data-theme on
  // <html> before React paints. We read the real stored preference in a
  // useEffect (post-hydration) so there is no server/client mismatch.
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')

  useEffect(() => {
    // Sync state with stored preference after hydration
    const stored = readStoredMode()
    setModeState(stored)
    setResolvedTheme(resolveTheme(stored))
  }, [])

  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(mode)
      setResolvedTheme(resolved)
      document.documentElement.setAttribute('data-theme', resolved)
    }

    apply()

    // When following the system, re-apply whenever the OS theme changes
    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [mode])

  function setMode(next: ThemeMode) {
    setModeState(next)
    if (next === 'system') {
      localStorage.removeItem('penpad-theme')
    } else {
      localStorage.setItem('penpad-theme', next)
    }
  }

  // Cycles: system → light → dark → system
  function toggleTheme() {
    setMode(mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system')
  }

  return (
    <ThemeContext.Provider value={{ mode, theme: resolvedTheme, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
