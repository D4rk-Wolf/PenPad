# Screenshot / Image Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Attach ordered, captioned screenshots to a finding (stored as Postgres `bytea`), manage them in the finding card, serve them auth'd to the app, and embed them (with captions) in the exported PDF — identical on cloud and self-hosted.

**Architecture:** Images live in a new `finding_images` table (`bytea`). Client downscales before upload (canvas); a route handler validates (mime sniff / size / count / ownership) and inserts. The app shows them via an auth'd serve route; the PDF export converts `bytea`→`data:` URIs and renders `@react-pdf` `<Image>`. No object storage, no `sharp`.

**Tech Stack:** Next 16 / React 19, Drizzle (dual migration lineage: Supabase SQL + `drizzle.config.selfhosted.ts`), `@react-pdf/renderer` 4.5.1, vitest. Spec: `docs/superpowers/specs/2026-06-19-screenshot-evidence-design.md`. Branch: `feat/screenshot-evidence` (off main; spec committed).

**Scoping note:** Image management lives on a **saved** finding (the finding card's expanded detail). The "add finding" form stays text-only for v1 (a finding must exist to own images). The `EvidenceImages` component is built reusable so it can move into the form later.

**Run from** `/home/turkish/Documents/D4rkWolf/studios/products/PenPad`. Tests: `pnpm test`. Build: `pnpm build`. Typecheck: `pnpm tsc --noEmit 2>&1 | grep "error TS" | grep -v validator.ts || echo CLEAN`.

---

## File Structure
```
src/lib/db/schema.ts                         MODIFY  + bytea customType + finding_images table
supabase/migrations/<ts>_finding_images.sql  CREATE  cloud DDL (NOT applied by implementer)
drizzle/ (selfhosted baseline)               REGEN   drizzle-kit generate --config drizzle.config.selfhosted.ts
src/lib/images.ts                            CREATE  constants + sniffImageMime + toDataUri
src/app/actions/finding-images.ts            CREATE  list/updateCaption/reorder/delete (ownership-checked)
src/app/api/findings/[findingId]/images/route.ts   CREATE  POST upload
src/app/api/finding-images/[id]/route.ts     CREATE  GET auth'd stream
src/components/findings/evidence-images.tsx  CREATE  client component (paste/drag/pick, thumbs, caption/reorder/delete)
src/components/findings/finding-card.tsx     MODIFY  mount <EvidenceImages>; accept images prop
src/app/(app)/reports/[id]/page.tsx          MODIFY  fetch image metadata, pass to FindingCard
src/components/pdf/report-document.tsx        MODIFY  import Image; render finding images + captions
src/app/(app)/reports/[id]/export/route.tsx  MODIFY  fetch images → data URIs → pass imagesByFinding
src/lib/__tests__/images.test.ts             CREATE  helper tests
src/lib/__tests__/finding-images.test.ts     CREATE  action/ownership tests (mocked db)
```

---

### Task 1: Schema — `finding_images` table (both lineages)

**Files:** Modify `src/lib/db/schema.ts`; Create `supabase/migrations/20260619120000_finding_images.sql`; regenerate self-hosted drizzle.

- [ ] **Step 1: Add a `bytea` custom type + the table to `schema.ts`**

At the top of `src/lib/db/schema.ts` add a custom bytea type (Drizzle has no native bytea), and the table at the end (before the type exports). Add `customType` to the `drizzle-orm/pg-core` import.
```ts
const bytea = customType<{ data: Buffer; default: false }>({
  dataType() { return 'bytea' },
})

export const findingImages = pgTable('finding_images', {
  id:         uuid('id').primaryKey().defaultRandom(),
  findingId:  uuid('finding_id').notNull().references(() => findings.id, { onDelete: 'cascade' }),
  data:       bytea('data').notNull(),
  mimeType:   text('mime_type').notNull(),
  caption:    text('caption'),
  sortOrder:  integer('sort_order').notNull().default(0),
  byteSize:   integer('byte_size').notNull(),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('finding_images_finding_id_sort_idx').on(t.findingId, t.sortOrder)])
```
Add `index` to the pg-core import. Add type exports near the others:
```ts
export type FindingImage    = typeof findingImages.$inferSelect
export type NewFindingImage = typeof findingImages.$inferInsert
```

- [ ] **Step 2: Cloud migration**

Create `supabase/migrations/20260619120000_finding_images.sql`:
```sql
CREATE TABLE IF NOT EXISTS public.finding_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id  uuid NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
  data        bytea NOT NULL,
  mime_type   text NOT NULL,
  caption     text,
  sort_order  integer NOT NULL DEFAULT 0,
  byte_size   integer NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS finding_images_finding_id_sort_idx
  ON public.finding_images (finding_id, sort_order);
ALTER TABLE public.finding_images ENABLE ROW LEVEL SECURITY;
```
(RLS enabled = deny-by-default for the Data API; the app uses the direct Drizzle connection. Matches the existing tables' posture.)

> Do NOT apply this to the live DB — the controller applies it at merge time.

- [ ] **Step 3: Regenerate the self-hosted drizzle baseline**

Run: `pnpm drizzle-kit generate --config drizzle.config.selfhosted.ts`
Expect a new `drizzle/000N_*.sql` adding `finding_images` + the index, and `drizzle/meta/_journal.json` updated. If it errors, STOP and report BLOCKED with output.

- [ ] **Step 4: Typecheck + commit**

`pnpm tsc --noEmit 2>&1 | grep "error TS" | grep -v validator.ts || echo CLEAN` → CLEAN.
```bash
git add src/lib/db/schema.ts supabase/migrations/20260619120000_finding_images.sql drizzle/
git commit -m "feat(evidence): finding_images bytea table (cloud + self-hosted migrations)"
```

---

### Task 2: Image helpers + constants

**Files:** Create `src/lib/images.ts`; Test `src/lib/__tests__/images.test.ts`.

- [ ] **Step 1: Failing test**

Create `src/lib/__tests__/images.test.ts`:
```ts
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
```

- [ ] **Step 2: Run → fail** — `pnpm test images 2>&1 | tail -12`.

- [ ] **Step 3: Implement `src/lib/images.ts`**
```ts
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
```

- [ ] **Step 4: Run → pass**, then **commit**:
```bash
git add src/lib/images.ts src/lib/__tests__/images.test.ts
git commit -m "feat(evidence): image mime-sniff + data-uri helpers + caps"
```

---

### Task 3: Upload route + management actions

**Files:** Create `src/app/api/findings/[findingId]/images/route.ts`, `src/app/actions/finding-images.ts`; Test `src/lib/__tests__/finding-images.test.ts`.

- [ ] **Step 1: Ownership helper + actions**

Create `src/app/actions/finding-images.ts`. Mirror the ownership pattern in `src/app/actions/findings.ts` (`assertReportOwner`) but keyed by finding: a finding is owned if its report's `user_id` is the current user. Implement:
```ts
'use server'
import { revalidatePath } from 'next/cache'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { requireUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { findings, findingImages, reports } from '@/lib/db/schema'
import { MAX_CAPTION_LEN } from '@/lib/images'

export async function assertFindingOwner(findingId: string): Promise<{ userId: string; reportId: string }> {
  const user = await requireUser()
  const [row] = await db
    .select({ reportId: findings.reportId })
    .from(findings)
    .innerJoin(reports, eq(reports.id, findings.reportId))
    .where(and(eq(findings.id, findingId), eq(reports.userId, user.id)))
    .limit(1)
  if (!row) throw new Error('Finding not found')
  return { userId: user.id, reportId: row.reportId }
}

/** Metadata only — never returns bytes. */
export async function listFindingImages(findingId: string) {
  await assertFindingOwner(findingId)
  return db
    .select({ id: findingImages.id, caption: findingImages.caption, sortOrder: findingImages.sortOrder })
    .from(findingImages)
    .where(eq(findingImages.findingId, findingId))
    .orderBy(asc(findingImages.sortOrder), asc(findingImages.createdAt))
}

const CaptionSchema = z.string().max(MAX_CAPTION_LEN)

export async function updateImageCaption(imageId: string, caption: string) {
  const fid = await imageFindingId(imageId)
  await assertFindingOwner(fid)
  const value = CaptionSchema.parse(caption)
  await db.update(findingImages).set({ caption: value }).where(eq(findingImages.id, imageId))
  await revalidatePathForFinding(fid)
}

export async function reorderImages(findingId: string, orderedIds: string[]) {
  await assertFindingOwner(findingId)
  await Promise.all(orderedIds.map((id, i) =>
    db.update(findingImages).set({ sortOrder: i }).where(and(eq(findingImages.id, id), eq(findingImages.findingId, findingId)))
  ))
  await revalidatePathForFinding(findingId)
}

export async function deleteImage(imageId: string) {
  const fid = await imageFindingId(imageId)
  await assertFindingOwner(fid)
  await db.delete(findingImages).where(eq(findingImages.id, imageId))
  await revalidatePathForFinding(fid)
}

async function imageFindingId(imageId: string): Promise<string> {
  const [row] = await db.select({ findingId: findingImages.findingId }).from(findingImages).where(eq(findingImages.id, imageId)).limit(1)
  if (!row) throw new Error('Image not found')
  return row.findingId
}

async function revalidatePathForFinding(findingId: string) {
  const [row] = await db.select({ reportId: findings.reportId }).from(findings).where(eq(findings.id, findingId)).limit(1)
  if (row?.reportId) revalidatePath(`/reports/${row.reportId}`)
}
```

- [ ] **Step 2: Upload route**

Create `src/app/api/findings/[findingId]/images/route.ts`:
```ts
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
```

- [ ] **Step 3: Tests (mocked db)**

Create `src/lib/__tests__/finding-images.test.ts` — mock `@/lib/db` and `@/lib/auth/session` (see how `subscriptions.test.ts` / existing tests mock them in `src/lib/__tests__/__mocks__`). Cover: `assertFindingOwner` throws for a non-owner (db returns no row); `sniffImageMime`-driven rejections are already in images.test; a caption over `MAX_CAPTION_LEN` rejects. Keep to the logic you can unit-test without a live DB. (If full route testing is impractical with the harness, assert the validation branches via the helpers and the Zod schema directly.)

- [ ] **Step 4: Verify + commit**

`pnpm test 2>&1 | tail -10` (pass), tsc CLEAN.
```bash
git add src/app/actions/finding-images.ts "src/app/api/findings/[findingId]/images/route.ts" src/lib/__tests__/finding-images.test.ts
git commit -m "feat(evidence): upload route + caption/reorder/delete actions (ownership-checked)"
```

---

### Task 4: Auth'd serve route

**Files:** Create `src/app/api/finding-images/[id]/route.ts`.

- [ ] **Step 1: Implement**
```ts
import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { requireUser } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { findingImages, findings, reports } from '@/lib/db/schema'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const [row] = await db
    .select({ data: findingImages.data, mimeType: findingImages.mimeType })
    .from(findingImages)
    .innerJoin(findings, eq(findings.id, findingImages.findingId))
    .innerJoin(reports, eq(reports.id, findings.reportId))
    .where(and(eq(findingImages.id, id), eq(reports.userId, user.id)))
    .limit(1)
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return new NextResponse(new Uint8Array(row.data), {
    headers: { 'Content-Type': row.mimeType, 'Cache-Control': 'private, max-age=60' },
  })
}
```

- [ ] **Step 2: Verify + commit**

`pnpm tsc --noEmit 2>&1 | grep "error TS" | grep -v validator.ts || echo CLEAN`; `pnpm build 2>&1 | tail -4` (success).
```bash
git add "src/app/api/finding-images/[id]/route.ts"
git commit -m "feat(evidence): auth'd image-serving route (owner-only, 404 on miss)"
```

---

### Task 5: UI — EvidenceImages component on the finding card

**Files:** Create `src/components/findings/evidence-images.tsx`; Modify `src/components/findings/finding-card.tsx`, `src/app/(app)/reports/[id]/page.tsx`.

- [ ] **Step 1: Build `evidence-images.tsx` (client)**

A `'use client'` component `EvidenceImages({ findingId, initialImages }: { findingId: string; initialImages: { id: string; caption: string | null; sortOrder: number }[] })`. Behaviour:
- Holds image list in state (seeded from `initialImages`).
- An upload zone that handles: file-input `onChange`, `onDrop` (dragover/drop), and a `paste` handler (on a focusable area or document-level while mounted) reading `e.clipboardData.files`.
- For each picked file: **downscale on a canvas** — load into an `Image`, draw to a canvas with the longest edge ≤ 1600px, `canvas.toBlob(cb, 'image/jpeg', 0.8)` (or keep png if it has alpha — simplest: always jpeg unless the source is png with transparency; jpeg is fine for screenshots). POST the blob as multipart (`FormData` with `file`) to `/api/findings/${findingId}/images`. On 201, append `{id, caption, sortOrder}` to state; on error, `toast.error(body.error)`.
- Render thumbnails via `<img src={`/api/finding-images/${img.id}`} />` with: an editable caption (`<input>` → `updateImageCaption` on blur via `useTransition`), a delete button (`deleteImage` → remove from state), and simple reorder (up/down buttons calling `reorderImages` with the new id order). Use the existing design-system classes (`btn btn-outline btn-sm`, `var(--*)` tokens) and `toast` from `sonner`. Match `status-select.tsx` for the `useTransition` pattern.

Import the actions from `@/app/actions/finding-images`. Keep the file focused; this is the one substantial component.

- [ ] **Step 2: Mount it in the finding card**

`src/components/findings/finding-card.tsx`: accept a new prop `images: { id: string; caption: string | null; sortOrder: number }[]` (default `[]`). In the expanded detail (after the Recommendation/Evidence sections), add a "Screenshots" section rendering `<EvidenceImages findingId={finding.id} initialImages={images} />`. Import the component.

- [ ] **Step 3: Feed images from the report page**

`src/app/(app)/reports/[id]/page.tsx`: after `getFindings(id)`, fetch image metadata for all findings in one query and group by findingId, then pass `images={imagesByFinding[finding.id] ?? []}` to each `<FindingCard>`. Add a server query (inline or a helper in `finding-images.ts` like `listImagesForReport(reportId)`) that selects `{id, findingId, caption, sortOrder}` joined through findings where `reports.user_id = current user`, ordered. Group into a `Record<findingId, ...[]>`.

- [ ] **Step 4: Verify + commit**

`pnpm build 2>&1 | tail -5` (success), `pnpm lint 2>&1 | tail -5`, tsc CLEAN.
```bash
git add src/components/findings/evidence-images.tsx src/components/findings/finding-card.tsx "src/app/(app)/reports/[id]/page.tsx" src/app/actions/finding-images.ts
git commit -m "feat(evidence): paste/drag/pick screenshot UI on findings (caption/reorder/delete)"
```

---

### Task 6: PDF embedding

**Files:** Modify `src/components/pdf/report-document.tsx`, `src/app/(app)/reports/[id]/export/route.tsx`.

- [ ] **Step 1: Export route fetches images → data URIs**

In `export/route.tsx`, after loading `findingList`, fetch the report's images and build `imagesByFinding: Record<string, { dataUri: string; caption: string | null }[]>`:
```ts
import { findingImages } from '@/lib/db/schema'
import { toDataUri } from '@/lib/images'
// ...
const imageRows = await db
  .select({ findingId: findingImages.findingId, data: findingImages.data, mimeType: findingImages.mimeType, caption: findingImages.caption, sortOrder: findingImages.sortOrder })
  .from(findingImages)
  .where(inArray(findingImages.findingId, findingList.map(f => f.id)))
  .orderBy(asc(findingImages.sortOrder), asc(findingImages.createdAt))
const imagesByFinding: Record<string, { dataUri: string; caption: string | null }[]> = {}
for (const r of imageRows) {
  ;(imagesByFinding[r.findingId] ??= []).push({ dataUri: toDataUri(r.data, r.mimeType), caption: r.caption })
}
```
Add `inArray` to the `drizzle-orm` import. Pass `imagesByFinding` to `<ReportDocument ... imagesByFinding={imagesByFinding} />`. (Guard the empty-findings case: `inArray` with `[]` — skip the query if `findingList` is empty.)

- [ ] **Step 2: Render in the PDF document**

`report-document.tsx`: add `Image` to the `@react-pdf/renderer` import. Add an optional prop `imagesByFinding?: Record<string, { dataUri: string; caption: string | null }[]>` to `ReportDocument` and thread it to wherever findings are mapped. After the existing `finding.evidence` block, render the finding's images:
```tsx
{(imagesByFinding?.[finding.id] ?? []).map((img, i) => (
  <View key={i} wrap={false} style={{ marginTop: 6 }}>
    <Image src={img.dataUri} style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }} />
    {img.caption ? <Text style={styles.fieldValue}>{img.caption}</Text> : null}
  </View>
))}
```
Wrap image decoding so a bad image can't break the render (react-pdf will throw on an invalid src — if that's a risk, the export route already only stores validated images, so this is low-risk; keep it simple).

- [ ] **Step 3: Verify + commit**

`pnpm build 2>&1 | tail -5` (success — this exercises the react-pdf path at build), tsc CLEAN, `pnpm test 2>&1 | tail -6`.
```bash
git add src/components/pdf/report-document.tsx "src/app/(app)/reports/[id]/export/route.tsx"
git commit -m "feat(evidence): embed finding screenshots + captions in the PDF export"
```

---

### Task 7: Final verification

- [ ] **Step 1: Full gate**
```bash
pnpm test 2>&1 | tail -10
pnpm tsc --noEmit 2>&1 | grep "error TS" | grep -v validator.ts || echo CLEAN
pnpm build 2>&1 | tail -8
pnpm lint 2>&1 | tail -5
```
All green.

- [ ] **Step 2: STOP — do not merge/deploy.** Report branch state. The controller applies the Supabase `finding_images` migration to the live DB and pushes a preview at merge time; the report should note manual QA steps (paste a screenshot on a finding → see thumbnail → caption/reorder/delete → export PDF → screenshot appears with caption).

---

## Notes for the implementer
- **Dual migrations:** the cloud Supabase SQL is NOT applied during the build (controller does it at merge). The self-hosted drizzle baseline IS regenerated (Task 1 step 3).
- **Ownership everywhere:** every action/route checks ownership via finding→report→user; the serve route 404s for non-owners (no IDOR / no existence leak).
- **No `sharp`, no object storage** — client canvas downscale + server caps; bytea only.
- **`@react-pdf` `<Image>`** takes the `data:` URI directly.
- This plan stops at a verified branch; merge/deploy is a deliberate later step (and rides with the cloud migration apply).
