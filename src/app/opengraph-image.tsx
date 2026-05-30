import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        background: '#121214',
        padding: '64px 80px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            background: '#b91c1c',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '2px', display: 'flex' }} />
        </div>
        <span style={{ color: '#e8e8e6', fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em' }}>
          PenPad
        </span>
      </div>

      {/* Headline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <p
          style={{
            color: '#b91c1c',
            fontSize: '16px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Penetration Testing Report Software
        </p>
        <h1
          style={{
            color: '#e8e8e6',
            fontSize: '76px',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
            margin: 0,
          }}
        >
          Reports without
          <br />
          <span style={{ color: '#b91c1c' }}>the friction.</span>
        </h1>
        <p style={{ color: '#78766f', fontSize: '24px', margin: 0, lineHeight: 1.4 }}>
          Log findings · CVSS v3.1 scoring · Client-ready PDFs
        </p>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div
          style={{
            background: '#b91c1c',
            color: '#ffffff',
            padding: '12px 28px',
            borderRadius: '6px',
            fontSize: '17px',
            fontWeight: 600,
            display: 'flex',
          }}
        >
          Start for free
        </div>
        <span style={{ color: '#504e49', fontSize: '16px' }}>penpad.co.uk</span>
      </div>
    </div>,
    size
  )
}
