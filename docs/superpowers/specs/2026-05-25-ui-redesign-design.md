# UI Redesign Design

## Goal

Replace the default shadcn scaffold look with a deliberate Clean Enterprise aesthetic — blue-primary, Inter typography, left sidebar navigation — that reads as a professional tool rather than a vibe-coded Next.js template.

## Direction

**Clean Enterprise.** Light mode default with dark mode toggle. Deep blue primary. Inter font. Left sidebar for app navigation. Severity colours are semantic (red/orange/yellow/blue/slate). Mobile sidebar collapses to a drawer.

---

## Colour Palette

All colours expressed as CSS custom properties in `globals.css`.

| Token | Value | Usage |
|---|---|---|
| `--primary` | `oklch(0.45 0.22 264)` ≈ blue-700 | CTAs, active nav, links |
| `--primary-foreground` | `oklch(0.99 0 0)` | Text on primary |
| `--background` | `oklch(0.99 0 0)` | Page / sidebar bg |
| `--foreground` | `oklch(0.09 0.01 264)` | Headings, body text |
| `--muted` | `oklch(0.97 0.005 264)` | App shell bg (slate-50) |
| `--muted-foreground` | `oklch(0.52 0.03 264)` | Secondary text |
| `--border` | `oklch(0.90 0.01 264)` | Card and nav borders |
| `--card` | `oklch(1 0 0)` | Card background |
| `--ring` | `oklch(0.55 0.18 264)` | Focus ring |

Severity badge colours are hardcoded Tailwind classes in `utils.ts` (already correct — no change needed):

| Severity | Badge bg | Badge text |
|---|---|---|
| critical | `bg-red-100` | `text-red-800` |
| high | `bg-orange-50` | `text-orange-800` |
| medium | `bg-yellow-50` | `text-yellow-800` |
| low | `bg-blue-50` | `text-blue-800` |
| info | `bg-slate-100` | `text-slate-600` |

`SEVERITY_COLOURS` in `src/lib/utils.ts` is updated to these classes.

---

## Typography

**Font**: Replace Geist with **Inter** from `next/font/google`. Inter is loaded with `subsets: ['latin']` and `variable: '--font-sans'` — no other changes to font infrastructure. Mono font stays as Geist Mono (used for evidence blocks).

Tailwind class conventions:
- Display/H1: `text-3xl font-extrabold tracking-tight`
- H2: `text-2xl font-bold tracking-tight`
- H3 / card title: `text-sm font-semibold`
- Body: `text-sm text-foreground`
- Caption/meta: `text-xs text-muted-foreground`

---

## App Navigation: Left Sidebar

`src/app/(app)/layout.tsx` is rewritten. The top `<header>` is replaced with a fixed-width sidebar.

**Sidebar structure:**
- Logo area (top): blue dot + "PenPad" logotype
- Nav section: Reports, Templates links with icon glyphs (lucide-react `FileText`, `BookTemplate`)
- Account section label + Settings link
- Footer (bottom): user avatar initial + email truncated + "Sign out" button

**Active link**: highlighted with `bg-primary/10 text-primary font-semibold`. Inactive: `text-muted-foreground hover:bg-muted`.

**App main area**: `<main>` sits beside the sidebar. Each page gets an inner topbar (`bg-background border-b`) with the page title + primary action button.

Layout shell:
```
<div class="flex h-screen bg-muted">
  <Sidebar />                         // 220px, bg-background, border-r
  <div class="flex flex-col flex-1 overflow-hidden">
    <main class="flex-1 overflow-y-auto p-6">
      {children}
    </main>
  </div>
</div>
```

Lucide icons are available via `lucide-react` (already in the project as a shadcn dependency).

---

## Landing Page

`src/app/page.tsx` is rewritten with three sections:

**Nav**: Logo (dot + wordmark), "Features" + "Pricing" anchor links, "Sign in" ghost button, "Get started free" primary button.

**Hero**:
- Small badge: "Free to start · No card required"
- H1: "Pen test reports that **look like you wrote them**" — the word "look like you wrote them" in `text-primary`
- Subheading: existing copy, tightened
- Two CTAs: "Start for free" (primary) + "See pricing →" (outline)
- Background: subtle `bg-gradient-to-b from-background to-blue-50/40`

**Features strip** (3-column grid):
- CVSS Scoring, Professional PDFs, Finding Templates — each with a lucide icon in a `bg-primary/10 rounded-lg` container

**Pricing** (unchanged layout, restyled): pro card uses `border-primary/50 shadow-sm`

**Footer**: "PenPad by D4rkWolf Studios" — unchanged copy, restyled

---

## Report Cards

`src/components/reports/report-card.tsx`:
- Add severity badge cluster below the date range — counts findings by severity using `report.findingCounts` (see Data section)
- Status badge: `Draft` = `bg-slate-100 text-slate-600`, `Final` = `bg-green-100 text-green-700`
- Card hover: `hover:shadow-sm transition-shadow`

**Finding count display**: The dashboard page already fetches the finding list per report — pass a `findingCounts` prop to `ReportCard` (computed from the findings on the report page) — **OR** keep it simple: don't add counts to the card, just improve the visual styling. Counts require an extra query per report on the dashboard which isn't worth it. **Decision: no counts on dashboard cards.** Remove badge cluster from ReportCard. Keep clean: name, status badge, date range, delete button.

---

## Finding Card

`src/components/findings/finding-card.tsx`: minimal polish only.
- Severity badge uses updated `SEVERITY_COLOURS` classes (already correct after colour change)
- `CardHeader` gets a left `border-l-2` coloured by severity for visual scanning
- Evidence `<pre>` block: `font-mono text-xs bg-muted` (already uses `bg-muted` — no change)

Severity border colours added to `SEVERITY_COLOURS` or a new `SEVERITY_BORDER_COLOURS` map in `utils.ts`:

```
critical: border-l-red-500
high:     border-l-orange-400
medium:   border-l-yellow-400
low:      border-l-blue-400
info:     border-l-slate-300
```

---

## Auth Pages

`src/components/auth/auth-form.tsx`: centre the form with the PenPad logo above it (dot + wordmark, same as sidebar). Card gets `shadow-sm`. No structural changes.

---

## Metadata

`src/app/layout.tsx`: fix title from `"Create Next App"` → `"PenPad"` and description → `"Professional pen test report tool"`.

---

## Dark Mode

Dark mode is toggled explicitly (not `prefers-color-scheme` auto). The user's preference is stored in `localStorage` under `penpad-theme` and applied via a `ThemeProvider` component that adds/removes the `dark` class on `<html>`.

**`src/components/theme-provider.tsx`** (new): reads localStorage on mount, exposes `useTheme()` hook returning `{ theme, toggleTheme }`.

**Dark colour tokens** added to `src/app/globals.css` under `.dark { }`:

| Token | Dark value |
|---|---|
| `--background` | `oklch(0.11 0.01 264)` |
| `--foreground` | `oklch(0.95 0.005 264)` |
| `--muted` | `oklch(0.15 0.01 264)` |
| `--muted-foreground` | `oklch(0.65 0.02 264)` |
| `--border` | `oklch(0.22 0.01 264)` |
| `--card` | `oklch(0.13 0.01 264)` |
| `--primary` | unchanged (blue reads well on dark) |
| `--ring` | unchanged |

**Toggle placement**: a sun/moon icon button (`lucide-react` `Sun` / `Moon`) in the sidebar footer, next to the user avatar. Uses `useTheme()`.

**Flash prevention**: `src/app/layout.tsx` injects an inline `<script>` before `<body>` that reads localStorage and sets the `dark` class synchronously — prevents the light→dark flash on load.

---

## Mobile / Responsive

Target: sidebar collapses on screens narrower than `md` (768px). The rest of the layout is already responsive by nature (single-column cards, stacking forms).

**`src/components/layout/mobile-header.tsx`** (new): shown only on `< md`. Contains:
- Hamburger button (`lucide-react` `Menu`) that opens the sidebar as an overlay drawer
- PenPad logo (dot + wordmark, centred)

**Sidebar on mobile**: the `<Sidebar>` component renders as `fixed inset-y-0 left-0 z-50` with a backdrop overlay when open. Toggle state lives in the parent layout via `useState`. On `md+` the sidebar is always visible (`md:relative md:translate-x-0`) and the mobile header is hidden (`md:hidden`).

**Layout shell update**:
```
<div class="flex h-screen bg-muted">
  <MobileHeader onMenuClick={...} />           // visible < md only
  <Sidebar open={sidebarOpen} onClose={...} /> // overlay < md, static md+
  <div class="flex flex-col flex-1 overflow-hidden md:ml-0">
    <main class="flex-1 overflow-y-auto p-4 md:p-6">
      {children}
    </main>
  </div>
</div>
```

No changes to report page or finding form — they are already single-column and readable on mobile.

---

## PDF Export Redesign

The existing `report-document.tsx` generates one finding per page with no brand treatment. The redesign brings it up to the standard of professional pentest firms (Cure53, Trail of Bits, NCC Group).

### Data: Affected Component field

Add optional `affected_component text` column to the `findings` table:

- New migration: `supabase/migrations/[timestamp]_add_affected_component.sql`
- `src/lib/db/schema.ts`: add `affectedComponent: text('affected_component')` to the `findings` table definition
- `src/components/findings/finding-form.tsx`: add an optional "Affected Component" text input (placeholder: "e.g. /api/v1/login, src/auth/middleware.ts") between the title and description fields
- No changes to existing `getFindings` / `createFinding` server actions — Supabase select/insert already pass through unknown columns once the schema is updated

### Finding IDs

Auto-generated at render time in `report-document.tsx`. No DB field needed.

Formula: take `report.clientName`, strip non-alpha chars, uppercase, truncate to 4 chars. Pad finding index to 3 digits.

```
clientCode = report.clientName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4)
findingId  = `${clientCode}-${String(index + 1).padStart(3, '0')}`
// e.g. "ACME-001", "MULL-003"
```

### Cover Page

Replaces the current plain centered-text cover.

- **Header band** (`#1d4ed8` background, 56pt height): PenPad dot + "PENPAD" wordmark left; "Penetration Test Report / Security Assessment" right in small uppercase — both white
- **Eyebrow**: thin rule + "Security Assessment Report" label in blue, below band
- **Title**: "Penetration Test Report" bold, large
- **Client name**: in `#2563eb` blue, semibold, below title
- **Divider line**
- **2×2 meta grid**: Assessment Period, Prepared By, Classification, Total Findings
- **Risk overview row**: 5 coloured cells — Critical (red), High (orange), Medium (yellow), Low (blue), Info (slate) — each showing count + label
- **Confidential banner**: amber background, "⚠ Confidential — For authorised recipients only"
- **Footer**: "Generated by PenPad · penpad.io" left, "Page 1" right

### Finding Pages

Replace one-finding-per-page with multiple findings per page, approximately 2–3 per page depending on content length.

Each page has:
- **Running header**: white background, `#1d4ed8` bottom border; PenPad dot+name left; "ClientName — Report Title · CONFIDENTIAL" right
- **Section heading** (first page of findings only): circled "F" icon + "Findings" label
- **Finding block** per finding: left border coloured by severity; header row with title (left) + severity badge + CVSS score (right); then labelled fields:
  - **Finding ID** (e.g., ACME-001) — shown in header row alongside title
  - **Affected Component** (if present) — `url/file/component`
  - **Description**
  - **Impact**
  - **Recommendation**
  - **PoC / Evidence** (renamed from "Evidence") — monospace block, only if present
- **Page footer**: PenPad left, report title centre, page number right

`@react-pdf/renderer` constraint: all styles are inline via `StyleSheet.create()`. No CSS variables. All colours are hardcoded hex. Severity hex map already exists in the file (`SEVERITY_HEX`) — extend it with border colours.

---

## Files

| File | Change |
|---|---|
| `src/app/layout.tsx` | Fix metadata; swap Geist Sans → Inter; add flash-prevention script; wrap in ThemeProvider |
| `src/app/globals.css` | Replace colour tokens with blue-primary palette; add `.dark {}` tokens |
| `src/lib/utils.ts` | Update `SEVERITY_COLOURS` to Tailwind bg/text classes; add `SEVERITY_BORDER_COLOURS` |
| `src/app/(app)/layout.tsx` | Replace top nav with left sidebar; add mobile header + drawer behaviour |
| `src/app/page.tsx` | Rewrite landing page |
| `src/components/reports/report-card.tsx` | Polish: status badge colour, hover shadow |
| `src/components/findings/finding-card.tsx` | Add severity left border stripe |
| `src/components/auth/auth-form.tsx` | Add logo above form card |
| `src/components/theme-provider.tsx` | New: dark mode toggle context |
| `src/components/layout/mobile-header.tsx` | New: mobile hamburger + logo bar |
| `src/lib/db/schema.ts` | Add `affectedComponent` to findings table definition |
| `src/components/findings/finding-form.tsx` | Add Affected Component input field |
| `src/components/pdf/report-document.tsx` | Full redesign: cover band, running header, multi-finding pages, finding IDs, affected component |
| `supabase/migrations/[timestamp]_add_affected_component.sql` | New: add `affected_component text` column |

---

## Out of Scope

- Custom logo/icon asset
- Animation or transitions beyond `transition-shadow`
- Remediation status tracking (re-test workflow — separate feature)
- `prefers-color-scheme` auto dark mode (explicit toggle only)
