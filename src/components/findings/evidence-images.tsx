'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  updateImageCaption,
  reorderImages,
  deleteImage,
} from '@/app/actions/finding-images'
import { MAX_IMAGES_PER_FINDING } from '@/lib/images'

export type ImageMeta = { id: string; caption: string | null; sortOrder: number }

function downscaleToJpeg(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const MAX_EDGE = 1600
      let { width, height } = img
      if (width > MAX_EDGE || height > MAX_EDGE) {
        if (width >= height) {
          height = Math.round((height * MAX_EDGE) / width)
          width = MAX_EDGE
        } else {
          width = Math.round((width * MAX_EDGE) / height)
          height = MAX_EDGE
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('canvas unavailable')); return }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (!blob) { reject(new Error('toBlob failed')); return }
          resolve(blob)
        },
        'image/jpeg',
        0.8,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}

export function EvidenceImages({
  findingId,
  initialImages,
}: {
  findingId: string
  initialImages: ImageMeta[]
}) {
  const [images, setImages] = useState<ImageMeta[]>(
    [...initialImages].sort((a, b) => a.sortOrder - b.sortOrder),
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const dropRef = useRef<HTMLDivElement>(null)

  // Paste handler — listen globally while component is mounted
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const files = e.clipboardData?.files
      if (!files || files.length === 0) return
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length === 0) return
      e.preventDefault()
      imageFiles.forEach((f) => uploadOne(f))
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]) // re-register so closure picks up latest images count

  async function uploadOne(file: File) {
    if (images.length >= MAX_IMAGES_PER_FINDING) {
      const msg = `Maximum ${MAX_IMAGES_PER_FINDING} images per finding`
      setError(msg)
      toast.error(msg)
      return
    }
    setError(null)
    setUploading(true)
    try {
      const blob = await downscaleToJpeg(file)
      const fd = new FormData()
      fd.append('file', blob, 'screenshot.jpg')
      const res = await fetch(`/api/findings/${findingId}/images`, {
        method: 'POST',
        body: fd,
      })
      const body = await res.json()
      if (!res.ok) {
        const msg = body?.error ?? 'Upload failed'
        setError(msg)
        toast.error(msg)
        return
      }
      const meta: ImageMeta = { id: body.id, caption: body.caption ?? null, sortOrder: body.sortOrder ?? images.length }
      setImages((prev) => [...prev, meta].sort((a, b) => a.sortOrder - b.sortOrder))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((f) => uploadOne(f))
    e.target.value = ''
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    files.forEach((f) => uploadOne(f))
  }

  function handleCaptionBlur(imageId: string, value: string) {
    startTransition(async () => {
      try {
        await updateImageCaption(imageId, value)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update caption')
      }
    })
  }

  function handleDelete(imageId: string) {
    startTransition(async () => {
      try {
        await deleteImage(imageId)
        setImages((prev) => prev.filter((img) => img.id !== imageId))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete image')
      }
    })
  }

  function handleMove(index: number, direction: 'up' | 'down') {
    const next = [...images]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    const reordered = next.map((img, i) => ({ ...img, sortOrder: i }))
    setImages(reordered)
    const orderedIds = reordered.map((img) => img.id)
    startTransition(async () => {
      try {
        await reorderImages(findingId, orderedIds)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to reorder images')
      }
    })
  }

  const isAtLimit = images.length >= MAX_IMAGES_PER_FINDING

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Drop / pick zone */}
      {!isAtLimit && (
        <div
          ref={dropRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            border: `1px dashed var(--border)`,
            borderRadius: 'var(--r-md)',
            padding: '14px',
            textAlign: 'center',
            color: 'var(--fg-muted)',
            fontSize: 'var(--fs-sm)',
            opacity: uploading || isPending ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          <label
            style={{ cursor: uploading ? 'not-allowed' : 'pointer', display: 'block' }}
            aria-label="Upload screenshot"
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              disabled={uploading}
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            {uploading ? 'Uploading…' : 'Click to pick, drag & drop, or paste a screenshot'}
          </label>
        </div>
      )}
      {isAtLimit && (
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)', margin: 0 }}>
          Maximum {MAX_IMAGES_PER_FINDING} images reached.
        </p>
      )}

      {/* Error message */}
      {error && (
        <p
          role="alert"
          style={{ fontSize: 'var(--fs-sm)', color: 'var(--sev-critical)', margin: 0 }}
        >
          {error}
        </p>
      )}

      {/* Thumbnails */}
      {images.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          {images.map((img, index) => (
            <div
              key={img.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                width: '164px',
                opacity: isPending ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              <img
                src={`/api/finding-images/${img.id}`}
                alt={img.caption ?? `Screenshot ${index + 1}`}
                style={{
                  width: '160px',
                  height: '100px',
                  objectFit: 'cover',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  display: 'block',
                }}
              />
              <input
                type="text"
                defaultValue={img.caption ?? ''}
                placeholder="Caption…"
                maxLength={300}
                onBlur={(e) => handleCaptionBlur(img.id, e.target.value)}
                aria-label={`Caption for screenshot ${index + 1}`}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  fontSize: 'var(--fs-xs)',
                  padding: '3px 6px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  background: 'transparent',
                  color: 'var(--fg)',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={isPending || index === 0}
                  onClick={() => handleMove(index, 'up')}
                  aria-label="Move image left"
                  style={{ flex: 1, fontSize: 'var(--fs-xs)', padding: '2px 0' }}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={isPending || index === images.length - 1}
                  onClick={() => handleMove(index, 'down')}
                  aria-label="Move image right"
                  style={{ flex: 1, fontSize: 'var(--fs-xs)', padding: '2px 0' }}
                >
                  →
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={isPending}
                  onClick={() => handleDelete(img.id)}
                  aria-label={`Delete screenshot ${index + 1}`}
                  style={{
                    flex: 1,
                    fontSize: 'var(--fs-xs)',
                    padding: '2px 0',
                    color: 'var(--sev-critical)',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
