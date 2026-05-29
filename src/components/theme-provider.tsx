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
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    typeof window === 'undefined' ? 'light' : resolveTheme(readStoredMode())
  )

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
