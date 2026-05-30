import type { Metadata } from 'next'
import Link from 'next/link'
import { BrandMark } from '@/components/penpad/brand-mark'
import { Icons } from '@/components/penpad/icons'

export const metadata: Metadata = {
  title: 'PenPad — Penetration Testing Report Software',
  description:
    'Replace Word docs with a purpose-built penetration testing report tool. Log findings, auto-score with CVSS v3.1, and generate polished PDF reports. Free to start.',
  openGraph: {
    title: 'PenPad — Penetration Testing Report Software',
    description:
      'Replace Word docs with a purpose-built penetration testing report tool. Log findings, auto-score with CVSS v3.1, and generate polished PDF reports.',
    url: '/',
  },
  alternates: { canonical: '/' },
}

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PenPad',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'Web',
  description:
    'Penetration testing report software for security professionals. Log findings, score with CVSS v3.1, and export client-ready PDF reports.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://penpad.co.uk',
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'GBP' },
    { '@type': 'Offer', name: 'Pro', price: '49', priceCurrency: 'GBP', billingDuration: 'P1M' },
  ],
  provider: {
    '@type': 'Organization',
    name: 'D4rkWolf Studios',
    url: 'https://d4rkwolf.co.uk',
  },
}

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'D4rkWolf Studios',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://penpad.co.uk',
  logo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://penpad.co.uk'}/icon.svg`,
  contactPoint: { '@type': 'ContactPoint', email: 'security@d4rkwolf.co.uk' },
}

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <BrandMark size={22} />
            <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em', color: 'var(--fg)' }}>PenPad</span>
          </Link>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#workflow">How it works</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="landing-nav-cta">
            <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link href="/signup" className="btn btn-accent btn-sm">Get started free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-eyebrow">
          <span className="pill-dot" />
          Built for working penetration testers
        </div>
        <h1 className="landing-headline">
          Ship client-ready reports<br />
          <em>without the friction</em>
        </h1>
        <p className="landing-sub">
          Log findings, score with CVSS v3.1, and generate polished PDFs — from first shell to final report.
        </p>
        <div className="landing-cta-row">
          <Link href="/signup" className="btn btn-accent btn-lg">Start for free</Link>
          <a href="#pricing" className="btn btn-outline btn-lg">See pricing</a>
          <span className="landing-cta-meta">No credit card required</span>
        </div>

        {/* Product mock */}
        <div className="landing-mock">
          <div className="landing-mock-frame">
            <div style={{ display: 'flex', gap: '1px', height: '100%' }}>
              {/* Mini sidebar */}
              <div style={{ width: '140px', background: 'var(--bg)', borderRight: '1px solid var(--border)', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', marginBottom: '8px' }}>
                  <BrandMark size={16} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fg)' }}>PenPad</span>
                </div>
                {['Reports', 'Templates', 'Settings'].map((label, i) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', borderRadius: '5px', fontSize: '11px', background: i === 0 ? 'var(--bg-elev)' : 'transparent', color: i === 0 ? 'var(--fg)' : 'var(--fg-muted)', fontWeight: i === 0 ? 500 : 400 }}>
                    {label}
                  </div>
                ))}
              </div>
              {/* Main area */}
              <div style={{ flex: 1, padding: '12px 14px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fg)' }}>Acme Corp — External Pentest</span>
                  <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'color-mix(in srgb, var(--sev-medium) 15%, transparent)', color: 'var(--sev-medium)', fontWeight: 500 }}>Active</span>
                </div>
                {[
                  { title: 'RCE via Deserialization', sev: 'critical', cvss: '9.8' },
                  { title: 'SQL Injection — Error Based', sev: 'critical', cvss: '9.1' },
                  { title: 'Broken Object Level Auth', sev: 'high', cvss: '8.1' },
                  { title: 'JWT Algorithm Confusion', sev: 'high', cvss: '8.8' },
                  { title: 'Reflected XSS in Error Message', sev: 'high', cvss: '7.4' },
                ].map(({ title, sev, cvss }) => (
                  <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: '10px' }}>
                    <span style={{ padding: '1px 5px', borderRadius: '3px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', background: sev === 'critical' ? 'color-mix(in srgb, var(--sev-critical) 15%, transparent)' : 'color-mix(in srgb, var(--sev-high) 15%, transparent)', color: sev === 'critical' ? 'var(--sev-critical)' : 'var(--sev-high)' }}>{sev}</span>
                    <span style={{ flex: 1, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                    <span className="mono" style={{ color: 'var(--fg-muted)' }}>{cvss}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="landing-section">
        <div className="landing-section-eyebrow">Features</div>
        <h2 className="landing-section-title">Everything a pentest report needs</h2>
        <p className="landing-section-sub">No word processors. No formatting fights. Just structured findings and one-click exports.</p>
        <div className="feature-grid">
          {[
            { icon: <Icons.Shield size={18} />, num: '01', title: 'CVSS v3.1 Scoring', desc: 'Score every finding with the industry standard. Severity calculated automatically from your vector.' },
            { icon: <Icons.Download size={18} />, num: '02', title: 'PDF Export', desc: 'Client-ready reports with cover page, risk overview, finding details, and recommendations.' },
            { icon: <Icons.Stack size={18} />, num: '03', title: 'Finding Templates', desc: 'Build a reusable library. Import common findings and tweak per engagement — never write the same finding twice.' },
            { icon: <Icons.Eye size={18} />, num: '04', title: 'Risk Visualisation', desc: 'Severity distribution bars and CVSS gauges give clients an instant picture of their exposure.' },
            { icon: <Icons.Lock size={18} />, num: '05', title: 'Secure by Default', desc: 'Data encrypted at rest and in transit. Server-enforced access controls ensure your data stays isolated from other accounts.' },
            { icon: <Icons.Stack size={18} />, num: '06', title: 'Status Tracking', desc: 'Move reports through Draft → Active → Final. Clear status at a glance so nothing ships before it\'s ready.' },
          ].map(({ icon, num, title, desc }) => (
            <div key={num} className="feature-cell">
              <div className="feature-cell-icon">{icon}</div>
              <div className="feature-cell-num">{num}</div>
              <div className="feature-cell-title">{title}</div>
              <div className="feature-cell-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="landing-section">
        <div className="landing-section-eyebrow">Workflow</div>
        <h2 className="landing-section-title">From shell to client in four steps</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginTop: '40px' }}>
          {[
            { n: '1', title: 'Create a report', body: 'Name it, set the scope and dates. PenPad creates the structure.' },
            { n: '2', title: 'Log your findings', body: 'Add findings manually or import from your template library.' },
            { n: '3', title: 'Score with CVSS', body: 'Set the vector. Severity and CVSS score update automatically.' },
            { n: '4', title: 'Export the PDF', body: 'One click. Professional, client-ready output, every time.' },
          ].map(({ n, title, body }) => (
            <div key={n} style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', background: 'var(--bg)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--fs-xs)', fontWeight: 700, marginBottom: '12px' }}>{n}</div>
              <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', marginBottom: '6px', color: 'var(--fg)' }}>{title}</div>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', lineHeight: 1.5 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="landing-section">
        <div className="landing-section-eyebrow">Pricing</div>
        <h2 className="landing-section-title">Simple, transparent pricing</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '680px', margin: '40px auto 0' }}>
          {/* Free */}
          <div style={{ padding: '28px', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', background: 'var(--bg)' }}>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--fg)', marginBottom: '8px' }}>Free</div>
            <div style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg)', lineHeight: 1, marginBottom: '4px' }}>£0</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', marginBottom: '20px' }}>Up to 3 reports, 10 findings each</div>
            <ul className="price-features" style={{ marginBottom: '24px' }}>
              {['CVSS v3.1 scoring', 'Finding templates (read)', 'Status tracking', 'Community support'].map(f => (
                <li key={f}>
                  <Icons.Check size={14} />
                  <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Get started</Link>
          </div>
          {/* Pro */}
          <div style={{ padding: '28px', border: '2px solid var(--accent)', borderRadius: 'var(--r-lg)', background: 'var(--bg)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-11px', left: '20px', background: 'var(--accent)', color: '#fff', fontSize: 'var(--fs-xs)', fontWeight: 600, padding: '2px 10px', borderRadius: '99px', letterSpacing: '0.04em' }}>MOST POPULAR</div>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--fg)', marginBottom: '8px' }}>Pro</div>
            <div style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg)', lineHeight: 1, marginBottom: '4px' }}>
              £49<span style={{ fontSize: '16px', fontWeight: 400, color: 'var(--fg-muted)' }}>/mo</span>
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', marginBottom: '20px' }}>Unlimited reports and findings</div>
            <ul className="price-features" style={{ marginBottom: '24px' }}>
              {['Everything in Free', 'Unlimited reports', 'PDF export', 'Full template library', 'Priority support'].map(f => (
                <li key={f}>
                  <Icons.Check size={14} />
                  <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup" className="btn btn-accent" style={{ width: '100%', justifyContent: 'center' }}>Start free trial</Link>
          </div>
        </div>
      </section>

      {/* JSON-LD — < escaped to < so </script> can never break out of the tag */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema).replace(/</g, '\\u003c') }} />

      {/* Footer */}
      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
          <BrandMark size={18} />
          <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--fg)' }}>PenPad</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginBottom: '16px' }}>
          <Link href="/privacy" style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/terms" style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', textDecoration: 'none' }}>Terms</Link>
          <a href="mailto:security@d4rkwolf.co.uk" style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', textDecoration: 'none' }}>Security</a>
        </div>
        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-subtle)' }}>
          © 2026 D4rkWolf Studios. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
