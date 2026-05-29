'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  children?: ReactNode
}

export function Button({
  variant = 'outline',
  size = 'default',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const cls = [
    'btn',
    variant === 'primary' ? 'btn-primary' : '',
    variant === 'accent' ? 'btn-accent' : '',
    variant === 'ghost' ? 'btn-ghost' : '',
    size === 'sm' ? 'btn-sm' : '',
    size === 'lg' ? 'btn-lg' : '',
    size === 'icon' ? 'btn-icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  )
}

// ─── SeverityPill ─────────────────────────────────────────────────────────────

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export function SeverityPill({ severity }: { severity: Severity }) {
  return (
    <span className={`pill pill-${severity}`}>
      <span className="pill-dot" />
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  )
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

type ReportStatus = 'draft' | 'active' | 'final'

export function StatusPill({ status }: { status: ReportStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return (
    <span className={`pill pill-status-${status}`}>
      <span className="pill-dot" />
      {label}
    </span>
  )
}

// ─── CvssGauge ────────────────────────────────────────────────────────────────

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--sev-critical)',
  high: '#ea580c',
  medium: '#d97706',
  low: '#2563eb',
  info: '#64748b',
}

export function CvssGauge({ score }: { score: number }) {
  const pct = Math.min(Math.max(score / 10, 0), 1) * 100
  const sev = score >= 9 ? 'critical' : score >= 7 ? 'high' : score >= 4 ? 'medium' : score > 0 ? 'low' : 'info'

  return (
    <div className="cvss-gauge">
      <span className="cvss-gauge-num" style={{ color: SEV_COLOR[sev] }}>{score.toFixed(1)}</span>
      <div className="cvss-gauge-bar">
        <div className="cvss-gauge-fill" style={{ width: `${pct}%`, background: SEV_COLOR[sev] }} />
      </div>
    </div>
  )
}

// ─── SeverityBar ──────────────────────────────────────────────────────────────

interface SeverityCountsMap {
  critical?: number
  high?: number
  medium?: number
  low?: number
  info?: number
}

export function SeverityBar({ counts }: { counts: SeverityCountsMap }) {
  const total = Object.values(counts).reduce((s, n) => s + (n ?? 0), 0)
  if (total === 0) return null

  const allSegs: { key: Severity; n: number }[] = [
    { key: 'critical', n: counts.critical ?? 0 },
    { key: 'high', n: counts.high ?? 0 },
    { key: 'medium', n: counts.medium ?? 0 },
    { key: 'low', n: counts.low ?? 0 },
    { key: 'info', n: counts.info ?? 0 },
  ]
  const segments = allSegs.filter(s => s.n > 0)

  return (
    <div className="sev-bar" title={segments.map(s => `${s.key}: ${s.n}`).join(', ')}>
      {segments.map(({ key, n }) => (
        <div
          key={key}
          className={`sev-bar-seg ${key}`}
          style={{ width: `${(n / total) * 100}%` }}
        />
      ))}
    </div>
  )
}

// ─── SeverityCounts ───────────────────────────────────────────────────────────

export function SeverityCounts({ counts }: { counts: SeverityCountsMap }) {
  const order: Severity[] = ['critical', 'high', 'medium', 'low', 'info']
  const nonZero = order.filter(k => (counts[k] ?? 0) > 0)
  if (nonZero.length === 0) return <span className="muted">—</span>

  return (
    <div className="sev-counts">
      {nonZero.map(key => (
        <span key={key} className="sev-counts-item">
          <span className="sev-counts-dot" style={{ background: SEV_COLOR[key] }} />
          <span className="sev-counts-num">{counts[key]}</span>
          <span style={{ color: 'var(--fg-muted)', fontSize: 'var(--fs-xs)' }}>{key}</span>
        </span>
      ))}
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: ReactNode
  optional?: boolean
  hint?: string
  children: ReactNode
}

export function Field({ label, optional, hint, children }: FieldProps) {
  return (
    <div className="field">
      <label className="field-label">
        {label}
        {optional && <span className="field-optional">optional</span>}
      </label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="empty">
      {icon && <div className="empty-icon">{icon}</div>}
      <p className="empty-title">{title}</p>
      {subtitle && <p className="empty-subtitle">{subtitle}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}
