import { NextRequest, NextResponse } from 'next/server'
import { eq, count } from 'drizzle-orm'
import { db } from '@/lib/db'
import { findingImages } from '@/lib/db/schema'
import { assertFindingOwner } from '@/app/actions/finding-images'
import { sniffImageMime, MAX_IMAGE_BYTES, MAX_IMAGES_PER_FINDING } from '@/lib/images'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ findingId: string }> }) {
  const { findingId } = await params
  try {
    await assertFindingOwner(findingId)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.byteLength > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'Image too large (max 2MB)' }, { status: 400 })
  const mime = sniffImageMime(buf)
  if (!mime) return NextResponse.json({ error: 'Unsupported image type (png, jpeg, webp only)' }, { status: 400 })

  const [{ value: existing }] = await db.select({ value: count() }).from(findingImages).where(eq(findingImages.findingId, findingId))
  if ((existing ?? 0) >= MAX_IMAGES_PER_FINDING) return NextResponse.json({ error: `Max ${MAX_IMAGES_PER_FINDING} images per finding` }, { status: 400 })

  const [created] = await db.insert(findingImages).values({
    findingId, data: buf, mimeType: mime, byteSize: buf.byteLength, sortOrder: existing ?? 0,
  }).returning({ id: findingImages.id, caption: findingImages.caption, sortOrder: findingImages.sortOrder })

  return NextResponse.json(created, { status: 201 })
}
