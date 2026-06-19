import { describe, it, expect } from 'vitest'
import { sniffImageMime, toDataUri, ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES } from '@/lib/images'

const PNG = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0])
const JPEG = Buffer.from([0xff,0xd8,0xff,0xe0,0,0,0,0])
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0,0,0,0]), Buffer.from('WEBP')])
const GIF = Buffer.from('GIF89a')

describe('sniffImageMime', () => {
  it('detects png/jpeg/webp by magic bytes', () => {
    expect(sniffImageMime(PNG)).toBe('image/png')
    expect(sniffImageMime(JPEG)).toBe('image/jpeg')
    expect(sniffImageMime(WEBP)).toBe('image/webp')
  })
  it('returns null for disallowed types (gif)', () => {
    expect(sniffImageMime(GIF)).toBeNull()
  })
})

describe('toDataUri', () => {
  it('builds a data uri', () => {
    expect(toDataUri(PNG, 'image/png')).toMatch(/^data:image\/png;base64,/)
  })
})

it('exposes caps', () => {
  expect(ALLOWED_IMAGE_MIME).toContain('image/png')
  expect(MAX_IMAGE_BYTES).toBe(2_000_000)
})
