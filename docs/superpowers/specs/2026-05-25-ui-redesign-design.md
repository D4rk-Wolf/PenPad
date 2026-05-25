# UI Redesign Design

## Goal

Replace the default shadcn scaffold look with a deliberate Clean Enterprise aesthetic — blue-primary, Inter typography, left sidebar navigation — that reads as a professional tool rather than a vibe-coded Next.js template.

## Direction

**Clean Enterprise.** Light mode. Deep blue primary. Inter font. Left sidebar for app navigation. Severity colours are semantic (red/orange/yellow/blue/slate). No dark mode in this pass.

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

## Files

| File | Change |
|---|---|
| `src/app/layout.tsx` | Fix metadata title/description; swap Geist Sans → Inter |
| `src/app/globals.css` | Replace colour tokens with blue-primary palette |
| `src/lib/utils.ts` | Update `SEVERITY_COLOURS` to Tailwind bg/text classes |
| `src/app/(app)/layout.tsx` | Replace top nav with left sidebar |
| `src/app/page.tsx` | Rewrite landing page |
| `src/components/reports/report-card.tsx` | Polish: status badge colour, hover shadow |
| `src/components/findings/finding-card.tsx` | Add severity left border stripe |
| `src/components/auth/auth-form.tsx` | Add logo above form card |

---

## Out of Scope

- Dark mode toggle
- Responsive / mobile layout
- Custom logo/icon asset
- Animation or transitions beyond `transition-shadow`
- Changes to PDF export styling
