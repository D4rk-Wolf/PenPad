# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the default shadcn scaffold look with a Clean Enterprise aesthetic — blue-primary palette, Inter typography, left sidebar navigation, dark mode toggle, mobile drawer, and a professional PDF export.

**Architecture:** CSS tokens in globals.css drive all colour changes; a ThemeProvider client component handles dark mode with localStorage persistence; the app shell is split into server layout (data fetching) + client AppShell (sidebar state); PDF redesign is entirely within report-document.tsx using react-pdf inline styles.

**Tech Stack:** Next.js 16 App Router, Tailwind v4, shadcn/ui, lucide-react, @react-pdf/renderer, Inter from next/font/google, Supabase JS admin client

---

### Task 1: Blue-primary CSS palette

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Read the current globals.css**

Run: `cat src/app/globals.css`

- [ ] **Step 2: Replace the `:root` colour tokens**

In `src/app/globals.css`, replace the entire `:root { }` block (all `--` tokens) with:

```css
:root {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.09 0.01 264);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.09 0.01 264);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.09 0.01 264);
  --primary: oklch(0.45 0.22 264);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.97 0.005 264);
  --secondary-foreground: oklch(0.09 0.01 264);
  --muted: oklch(0.97 0.005 264);
  --muted-foreground: oklch(0.52 0.03 264);
  --accent: oklch(0.97 0.005 264);
  --accent-foreground: oklch(0.09 0.01 264);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.90 0.01 264);
  --input: oklch(0.90 0.01 264);
  --ring: oklch(0.55 0.18 264);
  --radius: 0.5rem;
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
}
```

- [ ] **Step 3: Replace the `.dark` colour tokens**

Replace the entire `.dark { }` block with:

```css
.dark {
  --background: oklch(0.11 0.01 264);
  --foreground: oklch(0.95 0.005 264);
  --card: oklch(0.13 0.01 264);
  --card-foreground: oklch(0.95 0.005 264);
  --popover: oklch(0.13 0.01 264);
  --popover-foreground: oklch(0.95 0.005 264);
  --primary: oklch(0.45 0.22 264);
  --primary-foreground: oklch(0.99 0 0);
  --secondary: oklch(0.15 0.01 264);
  --secondary-foreground: oklch(0.95 0.005 264);
  --muted: oklch(0.15 0.01 264);
  --muted-foreground: oklch(0.65 0.02 264);
  --accent: oklch(0.15 0.01 264);
  --accent-foreground: oklch(0.95 0.005 264);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(0.22 0.01 264);
  --input: oklch(0.22 0.01 264);
  --ring: oklch(0.55 0.18 264);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
}
```

- [ ] **Step 4: Verify no visual regressions**

Run: `pnpm dev` and check the landing page at localhost:3000. Primary buttons should be deep blue. Background should be near-white.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: blue-primary CSS palette with dark mode tokens"
```

---

### Task 2: Inter font + ThemeProvider

**Files:**
- Create: `src/components/theme-provider.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create ThemeProvider**

Create `src/components/theme-provider.tsx`:

```tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
}>({ theme: 'light', toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = localStorage.getItem('penpad-theme') as Theme | null
    if (stored) {
      setTheme(stored)
      document.documentElement.classList.toggle('dark', stored === 'dark')
    }
  }, [])

  function toggleTheme() {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('penpad-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
```

- [ ] **Step 2: Update layout.tsx**

Rewrite `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PenPad',
  description: 'Professional pen test report tool',
}

const themeScript = `
  (function() {
    var t = localStorage.getItem('penpad-theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
  })()
`

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verify font change**

Run `pnpm dev` and inspect the landing page — text should render in Inter (rounded, clean) not Geist (geometric).

- [ ] **Step 4: Commit**

```bash
git add src/components/theme-provider.tsx src/app/layout.tsx
git commit -m "feat: Inter font, ThemeProvider with dark mode toggle, flash prevention"
```

---

### Task 3: Severity colour maps

**Files:**
- Modify: `src/lib/utils.ts`

- [ ] **Step 1: Read current utils.ts**

Run: `cat src/lib/utils.ts`

- [ ] **Step 2: Update SEVERITY_COLOURS to soft palette**

Replace the existing `SEVERITY_COLOURS` constant with:

```ts
export const SEVERITY_COLOURS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-50 text-orange-800',
  medium: 'bg-yellow-50 text-yellow-800',
  low: 'bg-blue-50 text-blue-800',
  info: 'bg-slate-100 text-slate-600',
}
```

- [ ] **Step 3: Add SEVERITY_BORDER_COLOURS**

Add after `SEVERITY_COLOURS`:

```ts
export const SEVERITY_BORDER_COLOURS: Record<string, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-400',
  medium: 'border-l-yellow-400',
  low: 'border-l-blue-400',
  info: 'border-l-slate-300',
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm test`
Expected: all existing tests pass (no tests for utils colours yet — that's fine).

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat: soft severity colour palette and border colour map"
```

---

### Task 4: DB migration — affected_component field

**Files:**
- Create: `supabase/migrations/20260525000000_add_affected_component.sql`
- Modify: `src/lib/db/schema.ts`
- Modify: `src/app/actions/findings.ts`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/20260525000000_add_affected_component.sql`:

```sql
alter table findings
  add column if not exists affected_component text;
```

- [ ] **Step 2: Apply migration locally**

Run: `supabase db push` or `supabase migration up`

If using remote Supabase directly:
```bash
supabase db push --db-url "$DATABASE_URL"
```

Expected: migration applies without error.

- [ ] **Step 3: Update schema.ts**

In `src/lib/db/schema.ts`, add `affectedComponent` to the findings table definition after `evidence`:

```ts
affectedComponent: text('affected_component'),
```

- [ ] **Step 4: Update createFinding server action**

In `src/app/actions/findings.ts`, in the `createFinding` function, add `affected_component` to the insert object:

```ts
affected_component: formData.get('affectedComponent') as string || null,
```

- [ ] **Step 5: Update updateFinding server action**

In `src/app/actions/findings.ts`, in the `updateFinding` function, add `affected_component` to the update object:

```ts
affected_component: formData.get('affectedComponent') as string || null,
```

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260525000000_add_affected_component.sql \
        src/lib/db/schema.ts \
        src/app/actions/findings.ts
git commit -m "feat: add affected_component field to findings table and server actions"
```

---

### Task 5: App shell — sidebar, mobile header, AppShell

**Files:**
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/mobile-header.tsx`
- Create: `src/components/layout/app-shell.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Create Sidebar component**

Create `src/components/layout/sidebar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, BookTemplate, Settings, Sun, Moon, X } from 'lucide-react'
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
  { href: '/templates', label: 'Templates', icon: BookTemplate },
]

export function Sidebar({ user, signOut, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  const initial = user.email[0].toUpperCase()

  return (
    <>
      {/* Mobile overlay backdrop */}
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
          // Mobile: slide in/out
          open !== undefined && !open && '-translate-x-full md:translate-x-0',
          // Desktop: always visible
          'md:relative md:translate-x-0'
        )}
      >
        {/* Logo */}
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

        {/* Nav */}
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

        {/* Footer */}
        <div className="px-3 py-3 border-t border-border space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {initial}
            </div>
            <span className="text-xs text-muted-foreground truncate flex-1">{user.email}</span>
            <button
              onClick={toggleTheme}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full text-left text-xs text-muted-foreground hover:text-foreground px-0 py-0.5"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
```

- [ ] **Step 2: Create MobileHeader component**

Create `src/components/layout/mobile-header.tsx`:

```tsx
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
```

- [ ] **Step 3: Create AppShell component**

Create `src/components/layout/app-shell.tsx`:

```tsx
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
      <div className="flex flex-col flex-1 overflow-hidden md:ml-0">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Rewrite the app layout**

Rewrite `src/app/(app)/layout.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <AppShell user={{ email: user.email ?? '' }} signOut={signOut}>
      {children}
    </AppShell>
  )
}
```

- [ ] **Step 5: Verify layout renders**

Run `pnpm dev`, sign in, check that the sidebar is visible at localhost:3000/reports. Resize below 768px to confirm the mobile header appears and sidebar drawer works.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/sidebar.tsx \
        src/components/layout/mobile-header.tsx \
        src/components/layout/app-shell.tsx \
        src/app/(app)/layout.tsx
git commit -m "feat: left sidebar navigation with mobile drawer"
```

---

### Task 6: Landing page rewrite

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Read current page.tsx**

Run: `cat src/app/page.tsx`

- [ ] **Step 2: Rewrite landing page**

Replace `src/app/page.tsx` with:

```tsx
import Link from 'next/link'
import { Shield, FileText, BookTemplate } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-blue-50/40 flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm font-bold tracking-tight">PenPad</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get started free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted border border-border rounded-full px-3 py-1 mb-6">
          Free to start · No card required
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight max-w-2xl mb-4">
          Pen test reports that{' '}
          <span className="text-primary">look like you wrote them</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mb-8">
          Write findings, score vulnerabilities, and export client-ready PDF reports — without fighting a word processor.
        </p>
        <div className="flex items-center gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">Start for free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#pricing">See pricing →</a>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16 w-full">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-10">Everything you need to ship reports faster</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'CVSS Scoring', desc: 'Score findings with CVSS v3.1. Severity calculated automatically.' },
            { icon: FileText, title: 'Professional PDFs', desc: 'Export client-ready reports with cover page, risk overview, and findings.' },
            { icon: BookTemplate, title: 'Finding Templates', desc: 'Build a reusable library of common findings. Fill in the blanks.' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="border border-border shadow-none">
              <CardHeader className="pb-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-16 w-full">
        <h2 className="text-2xl font-bold tracking-tight text-center mb-10">Simple pricing</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card className="border border-border shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Free</CardTitle>
              <div className="text-3xl font-extrabold tracking-tight">£0</div>
              <p className="text-sm text-muted-foreground">Up to 3 reports, 10 findings each</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">✓ PDF export</p>
              <p className="text-sm text-muted-foreground">✓ CVSS scoring</p>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href="/signup">Get started</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border border-primary/50 shadow-sm">
            <CardHeader>
              <div className="text-xs font-semibold text-primary mb-1">Pro</div>
              <CardTitle className="text-sm font-semibold">Pro</CardTitle>
              <div className="text-3xl font-extrabold tracking-tight">£49<span className="text-base font-medium text-muted-foreground">/mo</span></div>
              <p className="text-sm text-muted-foreground">Unlimited reports and findings</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">✓ Everything in Free</p>
              <p className="text-sm text-muted-foreground">✓ Finding templates</p>
              <p className="text-sm text-muted-foreground">✓ Priority support</p>
              <Button className="w-full mt-4" asChild>
                <Link href="/signup">Start free trial</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        PenPad by D4rkWolf Studios
      </footer>
    </div>
  )
}
```

- [ ] **Step 3: Verify landing page**

Run `pnpm dev`, open localhost:3000. Check:
- Sticky nav with sign in + get started buttons
- Hero with blue-coloured "look like you wrote them"
- 3-column features grid with icons in blue containers
- 2-column pricing with pro card having blue border

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redesign landing page with hero, features, and pricing sections"
```

---

### Task 7: Component polish

**Files:**
- Modify: `src/components/reports/report-card.tsx`
- Modify: `src/components/findings/finding-card.tsx`
- Modify: `src/components/auth/auth-form.tsx`

- [ ] **Step 1: Read the three files**

Run:
```bash
cat src/components/reports/report-card.tsx
cat src/components/findings/finding-card.tsx
cat src/components/auth/auth-form.tsx
```

- [ ] **Step 2: Polish report-card.tsx**

Find the Card element and add `hover:shadow-sm transition-shadow` to its className.

Find the status badge (the element that shows "Draft" or "Final"). Replace whatever classes it currently has with:
```tsx
// Draft:
<span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-medium">
  Draft
</span>

// Final (conditional on report.status):
<span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
  Final
</span>
```

Use a ternary: `report.status === 'final' ? <Final badge JSX> : <Draft badge JSX>`. Adjust based on the actual status values in the codebase.

- [ ] **Step 3: Polish finding-card.tsx**

Import `SEVERITY_BORDER_COLOURS` from `@/lib/utils`.

Find the `CardHeader` element and add `border-l-4` plus the severity border colour:
```tsx
<CardHeader className={`border-l-4 ${SEVERITY_BORDER_COLOURS[finding.severity] ?? 'border-l-slate-300'} pl-4`}>
```

If `affectedComponent` is present on the finding, add a display line below the severity badge:
```tsx
{finding.affectedComponent && (
  <p className="text-xs font-mono text-muted-foreground mt-1">{finding.affectedComponent}</p>
)}
```

- [ ] **Step 4: Polish auth-form.tsx**

At the top of the form Card (before the CardHeader), add the PenPad logo:
```tsx
<div className="flex justify-center mb-6">
  <div className="flex items-center gap-2">
    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
    <span className="text-base font-bold tracking-tight">PenPad</span>
  </div>
</div>
```

Add `shadow-sm` to the Card's className.

- [ ] **Step 5: Run tests and verify**

Run: `pnpm test`

Then open the app and navigate to the reports dashboard, a report's findings, and the login page to visually confirm changes.

- [ ] **Step 6: Commit**

```bash
git add src/components/reports/report-card.tsx \
        src/components/findings/finding-card.tsx \
        src/components/auth/auth-form.tsx
git commit -m "feat: polish report card, finding card severity borders, and auth form logo"
```

---

### Task 8: Finding form — affectedComponent field

**Files:**
- Modify: `src/components/findings/finding-form.tsx`

- [ ] **Step 1: Read the finding form**

Run: `cat src/components/findings/finding-form.tsx`

- [ ] **Step 2: Add affectedComponent to the Fields type**

Find the `Fields` type (or equivalent interface for form values) and add:
```ts
affectedComponent?: string
```

- [ ] **Step 3: Add affectedComponent to the EMPTY/initial state**

Find the default/empty fields object and add:
```ts
affectedComponent: '',
```

- [ ] **Step 4: Add the Affected Component input to the form UI**

Insert between the title field and the description field:

```tsx
<div className="space-y-1">
  <Label htmlFor="affectedComponent">Affected Component <span className="text-muted-foreground font-normal">(optional)</span></Label>
  <Input
    id="affectedComponent"
    name="affectedComponent"
    value={fields.affectedComponent ?? ''}
    onChange={e => setFields(f => ({ ...f, affectedComponent: e.target.value }))}
    placeholder="e.g. /api/v1/login, src/auth/middleware.ts"
  />
</div>
```

- [ ] **Step 5: Include affectedComponent in template apply**

If there's a template-apply function that fills fields from a template, add:
```ts
affectedComponent: template.affectedComponent ?? '',
```

(Templates don't have this field from the DB, so it defaults to empty — that's correct.)

- [ ] **Step 6: Run tests and verify**

Run `pnpm dev`, open a report, try adding a finding. The "Affected Component" input should appear between Title and Description.

- [ ] **Step 7: Commit**

```bash
git add src/components/findings/finding-form.tsx
git commit -m "feat: add Affected Component optional field to finding form"
```

---

### Task 9: PDF redesign

**Files:**
- Modify: `src/components/pdf/report-document.tsx`

This is the most complex task. Read the full current file before starting.

- [ ] **Step 1: Read the current report-document.tsx**

Run: `cat src/components/pdf/report-document.tsx`

- [ ] **Step 2: Update SEVERITY_HEX and add border colours**

At the top of the file, replace/extend the severity colour maps:

```ts
const SEVERITY_HEX: Record<string, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  info: '#94a3b8',
}

const SEVERITY_BG_HEX: Record<string, string> = {
  critical: '#fee2e2',
  high: '#fff7ed',
  medium: '#fefce8',
  low: '#eff6ff',
  info: '#f8fafc',
}

const SEVERITY_TEXT_HEX: Record<string, string> = {
  critical: '#991b1b',
  high: '#9a3412',
  medium: '#854d0e',
  low: '#1d4ed8',
  info: '#64748b',
}

const BRAND_BLUE = '#1d4ed8'
const BRAND_BLUE_MID = '#2563eb'
```

- [ ] **Step 3: Add a helper for finding IDs**

```ts
function makeClientCode(clientName: string): string {
  return clientName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4)
}
```

- [ ] **Step 4: Define StyleSheet**

Replace the existing StyleSheet with:

```ts
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  // Running header (fixed, appears on every page)
  runningHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: BRAND_BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  rhLogo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rhDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: BRAND_BLUE_MID },
  rhName: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#1e3a8a' },
  rhRight: { fontSize: 7, color: '#94a3b8' },
  // Page body (padded to clear the running header)
  pageBody: { paddingTop: 44, paddingHorizontal: 28, paddingBottom: 28 },
  // Running footer
  runningFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  footerText: { fontSize: 7, color: '#94a3b8' },
  // Cover page
  coverBand: {
    backgroundColor: BRAND_BLUE,
    paddingHorizontal: 28,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  coverBandLogo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  coverBandDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#ffffff' },
  coverBandName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: 'rgba(255,255,255,0.85)', letterSpacing: 1 },
  coverBandRight: { fontSize: 7, color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  coverBody: { padding: 28, flex: 1 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  eyebrowRule: { width: 18, height: 2, backgroundColor: BRAND_BLUE_MID },
  eyebrowText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: BRAND_BLUE_MID, letterSpacing: 1 },
  coverTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0f172a', lineHeight: 1.2, marginBottom: 6 },
  coverClient: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: BRAND_BLUE_MID, marginBottom: 14 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginBottom: 14 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  metaItem: { width: '48%' },
  metaLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 },
  metaValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  riskHeading: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 7 },
  riskRow: { flexDirection: 'row', gap: 5, marginBottom: 14 },
  riskCell: { flex: 1, borderRadius: 4, padding: 6, alignItems: 'center', borderWidth: 1 },
  riskCount: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  riskLabel: { fontSize: 6, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginTop: 1 },
  confBanner: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 3,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  confText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#92400e' },
  coverFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 28,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Section heading on findings pages
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 10,
  },
  sectionNum: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: BRAND_BLUE,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionNumText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  sectionLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  // Finding block
  findingBlock: {
    borderLeftWidth: 3,
    borderRadius: 2,
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  fbHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 5 },
  fbTitleRow: { flex: 1, flexDirection: 'column', gap: 1 },
  fbId: { fontSize: 7, color: '#64748b', fontFamily: 'Helvetica-Bold' },
  fbTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  fbBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fbBadge: { fontSize: 7, fontFamily: 'Helvetica-Bold', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  fbCvss: { fontSize: 8, color: '#64748b' },
  fbLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 1, marginTop: 4 },
  fbValue: { fontSize: 8, color: '#374151', lineHeight: 1.4 },
  fbEvidence: { fontSize: 7, fontFamily: 'Courier', color: '#374151', backgroundColor: '#f1f5f9', padding: 5, marginTop: 2 },
})
```

- [ ] **Step 5: Write the CoverPage component**

```tsx
function CoverPage({ report, findings }: { report: ReportWithFindings; findings: Finding[] }) {
  const counts = {
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    medium: findings.filter(f => f.severity === 'medium').length,
    low: findings.filter(f => f.severity === 'low').length,
    info: findings.filter(f => f.severity === 'info').length,
  }

  const riskCells = [
    { key: 'critical', label: 'Critical', bg: '#fff1f2', border: '#fecdd3', count: counts.critical, color: '#be123c' },
    { key: 'high', label: 'High', bg: '#fff7ed', border: '#fed7aa', count: counts.high, color: '#c2410c' },
    { key: 'medium', label: 'Medium', bg: '#fefce8', border: '#fde68a', count: counts.medium, color: '#92400e' },
    { key: 'low', label: 'Low', bg: '#eff6ff', border: '#bfdbfe', count: counts.low, color: '#1d4ed8' },
    { key: 'info', label: 'Info', bg: '#f8fafc', border: '#e2e8f0', count: counts.info, color: '#64748b' },
  ]

  return (
    <Page size="A4" style={styles.page}>
      {/* Blue header band */}
      <View style={styles.coverBand}>
        <View style={styles.coverBandLogo}>
          <View style={styles.coverBandDot} />
          <Text style={styles.coverBandName}>PENPAD</Text>
        </View>
        <Text style={styles.coverBandRight}>{'Penetration Test Report\nSecurity Assessment'}</Text>
      </View>

      {/* Body */}
      <View style={styles.coverBody}>
        <View style={{ height: 16 }} />
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowRule} />
          <Text style={styles.eyebrowText}>SECURITY ASSESSMENT REPORT</Text>
        </View>
        <Text style={styles.coverTitle}>Penetration Test{'\n'}Report</Text>
        <Text style={styles.coverClient}>{report.clientName}</Text>
        <View style={styles.divider} />
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Assessment Period</Text>
            <Text style={styles.metaValue}>
              {report.startDate && report.endDate
                ? `${new Date(report.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} – ${new Date(report.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : 'Not specified'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Prepared By</Text>
            <Text style={styles.metaValue}>{report.assessorName ?? 'PenPad'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Classification</Text>
            <Text style={styles.metaValue}>Confidential</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Total Findings</Text>
            <Text style={styles.metaValue}>{findings.length}</Text>
          </View>
        </View>
        <Text style={styles.riskHeading}>RISK OVERVIEW</Text>
        <View style={styles.riskRow}>
          {riskCells.map(cell => (
            <View key={cell.key} style={[styles.riskCell, { backgroundColor: cell.bg, borderColor: cell.border }]}>
              <Text style={[styles.riskCount, { color: cell.color }]}>{cell.count}</Text>
              <Text style={[styles.riskLabel, { color: cell.color }]}>{cell.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.confBanner}>
          <Text style={styles.confText}>⚠ Confidential — For authorised recipients only</Text>
        </View>
      </View>

      <View style={styles.coverFooter}>
        <Text style={styles.footerText}>Generated by PenPad · penpad.io</Text>
        <Text style={styles.footerText}>Page 1</Text>
      </View>
    </Page>
  )
}
```

Note: if `report.assessorName` doesn't exist in the type, use `'PenPad'` as fallback or derive from report metadata. Check the actual type before using.

- [ ] **Step 6: Write the FindingsPages component**

```tsx
function FindingsPages({ report, findings }: { report: ReportWithFindings; findings: Finding[] }) {
  const code = makeClientCode(report.clientName)
  const rightHeader = `${report.clientName} — ${report.title} · CONFIDENTIAL`

  return (
    <Page size="A4" style={styles.page}>
      {/* Running header (fixed) */}
      <View style={styles.runningHeader} fixed>
        <View style={styles.rhLogo}>
          <View style={styles.rhDot} />
          <Text style={styles.rhName}>PenPad</Text>
        </View>
        <Text style={styles.rhRight}>{rightHeader}</Text>
      </View>

      {/* Running footer (fixed) */}
      <View style={styles.runningFooter} fixed>
        <Text style={styles.footerText}>PenPad</Text>
        <Text style={styles.footerText}>{report.title}</Text>
        <Text
          style={styles.footerText}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
        />
      </View>

      {/* Page body */}
      <View style={styles.pageBody}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionNum}>
            <Text style={styles.sectionNumText}>F</Text>
          </View>
          <Text style={styles.sectionLabel}>Findings</Text>
        </View>

        {findings.map((finding, i) => {
          const findingId = `${code}-${String(i + 1).padStart(3, '0')}`
          const borderColor = SEVERITY_HEX[finding.severity] ?? '#94a3b8'
          const badgeBg = SEVERITY_BG_HEX[finding.severity] ?? '#f8fafc'
          const badgeText = SEVERITY_TEXT_HEX[finding.severity] ?? '#64748b'

          return (
            <View key={finding.id} style={[styles.findingBlock, { borderLeftColor: borderColor }]} wrap={false}>
              <View style={styles.fbHeader}>
                <View style={styles.fbTitleRow}>
                  <Text style={styles.fbId}>{findingId}</Text>
                  <Text style={styles.fbTitle}>{finding.title}</Text>
                </View>
                <View style={styles.fbBadgeRow}>
                  <Text style={[styles.fbBadge, { backgroundColor: badgeBg, color: badgeText }]}>
                    {finding.severity.toUpperCase()}
                  </Text>
                  {finding.cvssScore != null && (
                    <Text style={styles.fbCvss}>CVSS {finding.cvssScore.toFixed(1)}</Text>
                  )}
                </View>
              </View>

              {finding.affectedComponent && (
                <>
                  <Text style={styles.fbLabel}>Affected Component</Text>
                  <Text style={styles.fbValue}>{finding.affectedComponent}</Text>
                </>
              )}

              <Text style={styles.fbLabel}>Description</Text>
              <Text style={styles.fbValue}>{finding.description}</Text>

              {finding.impact && (
                <>
                  <Text style={styles.fbLabel}>Impact</Text>
                  <Text style={styles.fbValue}>{finding.impact}</Text>
                </>
              )}

              <Text style={styles.fbLabel}>Recommendation</Text>
              <Text style={styles.fbValue}>{finding.recommendation}</Text>

              {finding.evidence && (
                <>
                  <Text style={styles.fbLabel}>PoC / Evidence</Text>
                  <Text style={styles.fbEvidence}>{finding.evidence}</Text>
                </>
              )}
            </View>
          )
        })}
      </View>
    </Page>
  )
}
```

- [ ] **Step 7: Wire up the Document export**

Replace the main `ReportDocument` export function with:

```tsx
export function ReportDocument({ report, findings }: { report: ReportWithFindings; findings: Finding[] }) {
  return (
    <Document>
      <CoverPage report={report} findings={findings} />
      <FindingsPages report={report} findings={findings} />
    </Document>
  )
}
```

Ensure imports include all needed react-pdf primitives: `Document, Page, View, Text, StyleSheet` from `@react-pdf/renderer`.

- [ ] **Step 8: Fix type references**

Check what the `Finding` type looks like in `src/lib/db/schema.ts`. It should now include `affectedComponent`. If the PDF component references old field names (e.g. `evidence` vs `evidenceText`), reconcile with the actual schema.

Run: `pnpm build` to catch type errors.
Expected: no TypeScript errors related to the PDF component.

- [ ] **Step 9: Test PDF generation**

Run `pnpm dev`, open a report with several findings of different severities, and click "Export PDF". Verify:
- Cover page has blue header band, risk overview cells, confidential banner
- Finding pages have running header with blue bottom border
- Each finding has a severity-coloured left border
- Finding IDs appear (e.g. ACME-001, ACME-002)
- Affected component field appears when set

- [ ] **Step 10: Commit**

```bash
git add src/components/pdf/report-document.tsx
git commit -m "feat: professional PDF redesign with cover page, running headers, and finding IDs"
```
