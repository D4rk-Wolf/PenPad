import 'server-only'
import { Resend } from 'resend'

export async function sendLicenseEmail(to: string, licenseKey: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) { console.warn('[email] RESEND_API_KEY unset — skipping license email'); return }
  const resend = new Resend(apiKey)
  const from = process.env.LICENSE_EMAIL_FROM ?? 'PenPad <noreply@penpad.co.uk>'
  const quickstart = [
    'Your PenPad Pro license is ready. Run it self-hosted:',
    '',
    '  docker run -e PENPAD_LICENSE_KEY=' + licenseKey + ' -p 3000:3000 ghcr.io/d4rk-wolf/penpad:latest',
    '',
    'Full setup: https://penpad.co.uk/docs/self-hosting',
  ].join('\n')
  try {
    await resend.emails.send({ from, to, subject: 'Your PenPad Pro license', text: quickstart })
  } catch (err) {
    console.error('[email] license email failed:', err)
  }
}
