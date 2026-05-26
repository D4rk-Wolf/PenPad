import Link from 'next/link'
import { BrandMark } from '@/components/penpad/brand-mark'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px',
      gap: '0',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginBottom: '48px' }}>
        <BrandMark size={22} />
        <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em', color: 'var(--fg)' }}>PenPad</span>
      </Link>

      <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-subtle)', marginBottom: '12px' }}>
        404
      </p>
      <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg)', marginBottom: '10px', textAlign: 'center' }}>
        Page not found
      </h1>
      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', marginBottom: '32px', textAlign: 'center', maxWidth: '340px', lineHeight: 1.5 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Link href="/dashboard" className="btn btn-accent btn-sm">Go to dashboard</Link>
        <Link href="/" className="btn btn-outline btn-sm">Home</Link>
      </div>
    </div>
  )
}
