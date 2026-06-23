export const ALLOWED_IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME)[number]
export const MAX_IMAGE_BYTES = 2_000_000
export const MAX_IMAGES_PER_FINDING = 20
export const MAX_CAPTION_LEN = 300

/** Detect image type from magic bytes; null if not an allowed type. */
export function sniffImageMime(buf: Buffer): AllowedImageMime | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  return null
}

export function toDataUri(buf: Buffer, mime: string): string {
  return `data:${mime};base64,${buf.toString('base64')}`
}
