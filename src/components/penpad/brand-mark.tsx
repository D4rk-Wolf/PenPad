interface BrandMarkProps {
  size?: number
}

/**
 * Scope Report mark: a dark document with a targeting crosshair in the
 * lower half — represents a security engagement scoped and documented.
 * Uses --mark-bg / --mark-fg tokens so it stays legible in both themes.
 */
export function BrandMark({ size = 22 }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Document body */}
      <rect x="4" y="2" width="16" height="20" rx="3" fill="var(--mark-bg)" />
      {/* Title lines */}
      <rect x="6.5" y="5.5" width="8" height="1.2" rx="0.5" fill="rgba(255,255,255,0.25)" />
      <rect x="6.5" y="8" width="5.5" height="1" rx="0.5" fill="rgba(255,255,255,0.14)" />
      {/* Outer target ring */}
      <circle cx="12" cy="15.5" r="4.5" stroke="var(--mark-fg)" strokeWidth="0.9" fill="none" opacity="0.35" />
      {/* Inner target ring */}
      <circle cx="12" cy="15.5" r="2.25" stroke="var(--mark-fg)" strokeWidth="0.9" fill="none" opacity="0.8" />
      {/* Crosshair lines */}
      <line x1="12" y1="11" x2="12" y2="20" stroke="var(--mark-fg)" strokeWidth="0.6" opacity="0.4" strokeDasharray="1.5 1" />
      <line x1="7.5" y1="15.5" x2="16.5" y2="15.5" stroke="var(--mark-fg)" strokeWidth="0.6" opacity="0.4" strokeDasharray="1.5 1" />
      {/* Centre dot — the finding */}
      <circle cx="12" cy="15.5" r="1.1" fill="var(--mark-fg)" />
    </svg>
  )
}
