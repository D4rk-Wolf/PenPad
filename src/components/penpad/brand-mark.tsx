interface BrandMarkProps {
  size?: number
  accent?: string
}

export function BrandMark({ size = 22, accent = 'var(--accent)' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="4" fill="var(--fg)" />
      <rect x="6" y="8" width="9" height="2.2" rx="0.5" fill={accent} />
      <rect x="6" y="12" width="12" height="2.2" rx="0.5" fill="var(--bg-elev)" opacity="0.85" />
      <rect x="6" y="16" width="6" height="2.2" rx="0.5" fill="var(--bg-elev)" opacity="0.55" />
    </svg>
  )
}
