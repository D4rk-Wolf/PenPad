import Link from 'next/link'
import { BrandMark } from '@/components/penpad/brand-mark'

export const metadata = { title: 'Terms of Service — PenPad' }

export default function TermsPage() {
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
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg)', marginBottom: '8px' }}>Terms of Service</h1>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', marginBottom: '48px' }}>Last updated: {updated}</p>

        {[
          {
            title: '1. Acceptance',
            body: 'By creating an account or using PenPad, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the service. These terms form a binding agreement between you and D4rkWolf Studios.',
          },
          {
            title: '2. Service description',
            body: 'PenPad is a web application for creating and managing penetration testing reports. Features include finding management, CVSS v3.1 scoring, PDF export, and a reusable template library. We reserve the right to modify or discontinue features with reasonable notice.',
          },
          {
            title: '3. Eligibility',
            body: 'You must be at least 18 years old to use PenPad. By using the service you confirm that you have the legal authority to enter into this agreement, either as an individual or on behalf of an organisation.',
          },
          {
            title: '4. Account responsibilities',
            body: `You are responsible for:

• Maintaining the confidentiality of your password.
• All activity that occurs under your account.
• Ensuring the accuracy of information you provide.
• Notifying us immediately of any unauthorised access.

You may not share your account or create accounts on behalf of others without their consent.`,
          },
          {
            title: '5. Acceptable use',
            body: `You agree not to use PenPad to:

• Document or facilitate unauthorised access to systems you do not own or have written permission to test.
• Store, transmit, or process data in violation of applicable laws or third-party rights.
• Attempt to reverse engineer, scrape, or disrupt the platform.
• Circumvent any access controls or security measures.

PenPad is intended for professional security testing work. Using it to document illegal activity will result in immediate account termination and may be reported to relevant authorities.`,
          },
          {
            title: '6. Subscription and payment',
            body: `**Free plan**: Access to core features with limits (3 reports, 10 findings each). No payment required.

**Pro plan**: £49/month, billed monthly via Stripe. Includes unlimited reports and findings, full template library, and PDF export.

Subscriptions renew automatically. You may cancel at any time via Settings → Billing → Manage subscription. Cancellation takes effect at the end of the current billing period — no partial refunds are issued for unused time.

We reserve the right to change pricing with 30 days' notice.`,
          },
          {
            title: '7. Your content',
            body: 'You retain all intellectual property rights to the reports, findings, and templates you create in PenPad. By using the service, you grant D4rkWolf Studios a limited licence to store and process your content solely to provide the service. We do not use your content for any other purpose.',
          },
          {
            title: '8. Confidentiality',
            body: 'We understand that pentest reports contain highly sensitive client information. We treat all user content as confidential and do not access it except as required to provide support, maintain the service, or comply with legal obligations.',
          },
          {
            title: '9. Disclaimer of warranties',
            body: 'PenPad is provided "as is" without warranty of any kind. We do not warrant that the service will be uninterrupted, error-free, or secure. PDF exports are provided for informational purposes — you are responsible for reviewing them before delivery to clients.',
          },
          {
            title: '10. Limitation of liability',
            body: 'To the maximum extent permitted by law, D4rkWolf Studios shall not be liable for any indirect, incidental, special, or consequential damages. Our total liability for any claim shall not exceed the amounts you paid us in the 12 months preceding the claim.',
          },
          {
            title: '11. Termination',
            body: 'You may delete your account at any time via Settings → Danger Zone. We may terminate or suspend your account for material breach of these terms, with or without notice. Upon termination, your right to use the service ends immediately and your data will be deleted per our retention policy.',
          },
          {
            title: '12. Governing law',
            body: 'These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.',
          },
          {
            title: '13. Contact',
            body: 'For questions about these terms: legal@d4rkwolf.co.uk\n\nD4rkWolf Studios, United Kingdom.',
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
          <Link href="/privacy" style={{ color: 'var(--fg-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/" style={{ color: 'var(--fg-muted)', textDecoration: 'none' }}>← Back to PenPad</Link>
        </div>
      </div>
    </div>
  )
}
