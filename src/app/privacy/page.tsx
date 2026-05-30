import Link from 'next/link'
import { BrandMark } from '@/components/penpad/brand-mark'

export const metadata = {
  title: 'Privacy Policy',
  description: 'How PenPad collects, uses, and protects your data.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  const updated = '26 May 2026'
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0 24px 80px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ padding: '32px 0 40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <BrandMark size={20} />
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--fg)' }}>PenPad</span>
          </Link>
        </div>

        <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--fg-subtle)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legal</p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg)', marginBottom: '8px' }}>Privacy Policy</h1>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', marginBottom: '48px' }}>Last updated: {updated}</p>

        {[
          {
            title: '1. Who we are',
            body: 'PenPad is operated by D4rkWolf Studios ("we", "us", "our"). We provide a web-based penetration testing report management platform. Our registered address and contact details are available at the bottom of this page.',
          },
          {
            title: '2. What data we collect',
            body: `We collect the following personal data:

• **Account data** — email address and optional full name, provided when you register.
• **Report data** — client names, scopes, dates, findings, and CVSS scores you enter into the platform. This is your content and we treat it as confidential.
• **Billing data** — payment card details are processed and stored by Stripe. We store only a Stripe customer ID and subscription status; we never see your card number.
• **Usage data** — page views, feature interactions, and error traces, collected to improve the service.
• **Technical data** — IP address, browser type, and session tokens, retained for security and fraud prevention.`,
          },
          {
            title: '3. How we use your data',
            body: `We use your data to:

• Provide and maintain the PenPad service.
• Process subscription payments via Stripe.
• Send transactional emails (account confirmation, password reset).
• Detect and prevent fraudulent or abusive activity.
• Improve the platform through anonymised analytics.

We do not sell your data to third parties. We do not use your report content to train AI models.`,
          },
          {
            title: '4. Third-party services',
            body: `We use the following sub-processors:

• **Supabase** (Supabase Inc.) — database and authentication. Data is hosted in the EU (eu-west-2 region).
• **Stripe** (Stripe Inc.) — payment processing. Stripe is PCI-DSS Level 1 certified.
• **Vercel** (Vercel Inc.) — hosting and edge delivery.
• **Sentry** (Functional Software Inc., USA) — error monitoring and session replay. Sentry captures application errors, performance traces, and — for a small percentage of sessions — screen recordings to help us diagnose and fix bugs. All replay recordings mask text input and block media. Sentry is SOC 2 Type II certified. Data may be transferred to the USA under Standard Contractual Clauses. See Sentry's privacy policy at sentry.io/privacy.

Each sub-processor has their own privacy policy and data processing agreements in place.`,
          },
          {
            title: '5. Data retention',
            body: 'We retain your account and report data for as long as your account is active. If you delete your account, all your data is permanently deleted within 30 days. Stripe retains billing records as required by financial regulations.',
          },
          {
            title: '6. Your rights (GDPR)',
            body: `If you are in the UK or EU, you have the right to:

• **Access** the personal data we hold about you.
• **Rectify** inaccurate or incomplete data.
• **Erase** your data ("right to be forgotten") — use the Delete Account option in Settings.
• **Restrict** or object to processing.
• **Data portability** — request a copy of your data in a machine-readable format.
• **Withdraw consent** at any time where processing is based on consent.

To exercise any of these rights, email us at privacy@d4rkwolf.co.uk.`,
          },
          {
            title: '7. Cookies',
            body: 'We use strictly necessary cookies for authentication (session tokens). We do not use tracking or advertising cookies. You cannot opt out of session cookies without losing access to the platform.',
          },
          {
            title: '8. Security',
            body: 'All data is encrypted in transit via TLS. Database contents are encrypted at rest. We enforce server-side access controls so users can only access their own data. We conduct regular security reviews.',
          },
          {
            title: '9. Changes to this policy',
            body: 'We may update this policy from time to time. We will notify registered users of material changes by email. Continued use of PenPad after changes constitutes acceptance of the updated policy.',
          },
          {
            title: '10. Contact',
            body: 'For privacy-related questions or requests: privacy@d4rkwolf.co.uk\n\nD4rkWolf Studios, United Kingdom.',
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--fg)', marginBottom: '10px' }}>{title}</h2>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {body.split('**').map((seg, i) =>
                i % 2 === 1 ? <strong key={i} style={{ color: 'var(--fg)', fontWeight: 600 }}>{seg}</strong> : seg
              )}
            </div>
          </div>
        ))}

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', gap: '20px', fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>
          <Link href="/terms" style={{ color: 'var(--fg-muted)', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/" style={{ color: 'var(--fg-muted)', textDecoration: 'none' }}>← Back to PenPad</Link>
        </div>
      </div>
    </div>
  )
}
