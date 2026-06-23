# PenPad — Screenshot / Image Evidence — Design

**Date:** 2026-06-19
**Author:** Connor Simmons (with Claude)
**Status:** Design — approved shape, pending written-spec review
**Roadmap:** Feature #1 of the competitive-parity roadmap (the table-stakes gap: every competitor supports annotated PoC screenshots; PenPad's evidence is text-only). Independent of the self-hosted packaging sub-project; branches off `main`.

---

## 1. Problem & Goal

A penetration-test report is built on **annotated proof-of-concept screenshots**. PenPad today stores evidence as a single text field and renders it as plain `<Text>` in the PDF — so it cannot produce a credible client deliverable, which is the most likely reason trial users build reports but don't convert.

**Goal:** Let a user attach ordered, captioned screenshots to a finding, manage them in the finding UI, and have them render as real images (with captions) in the exported PDF. Works identically on cloud and self-hosted.

---

## 2. Scope

### In scope
- Image attachments on findings: upload (drag-drop / click / **paste**), caption, reorder, delete.
- Storage as **Postgres `bytea`** (one code path; zero extra infra for self-hosters).
- Client-side downscale + server-side validation/caps (no `sharp`).
- Auth'd image-serving route for the app UI.
- PDF embedding of images + captions via `@react-pdf` `<Image>`.

### Out of scope (YAGNI)
- Server-side re-encode / EXIF stripping via `sharp` (note as a future hardening).
- Object storage / S3 / Supabase Storage (explicitly rejected — bytea chosen).
- Image annotation/markup editor (users annotate in their own screenshot tool).
- Separate Pro-gating of uploads (images are core report-building; the PDF is already the gated surface).

---

## 3. Architecture / Data Flow

```
Finding form ──(paste/drag/pick)──> client canvas downscale (~1600px, JPEG/WebP ~80%)
   ──multipart──> server action/route (auth: finding.report.user_id == current user;
                  validate mime png|jpeg|webp; hard cap ~2MB; insert bytea row)
   ──> finding_images (bytea + caption + sort_order)

Finding card/form  ── <img src="/api/finding-images/[id]"> (auth'd stream)
PDF export         ── fetch finding_images → data: URIs → <Image> + caption <Text>
```

---

## 4. Units

### 4.1 Data model — `finding_images` table
```
id          uuid pk default gen_random_uuid()
finding_id  uuid not null references findings(id) on delete cascade
data        bytea not null
mime_type   text not null            -- 'image/png' | 'image/jpeg' | 'image/webp'
caption     text                     -- optional
sort_order  integer not null default 0
byte_size   integer not null
created_at  timestamptz not null default now()
index on (finding_id, sort_order)
```
The existing `findings.evidence` text field stays — images are complementary to textual evidence.

Drizzle (`bytea` has no native Drizzle type) — define a small `customType<{ data: Buffer }>` for `bytea` in `src/lib/db/schema.ts` (or a `schema-custom.ts`) and use it for `data`.

### 4.2 Upload (client → server)
- **Client** (`finding-form` + a reusable `EvidenceImages` client component): accept drop, file-picker, and `paste` events (read `ClipboardEvent.clipboardData.files`/items). For each image: draw to a canvas, downscale longest edge to ≤1600px, export to JPEG (or keep PNG if it has transparency) at ~0.8 quality, POST as multipart.
- **Server** (a route handler `POST /api/findings/[findingId]/images`, runtime nodejs): `requireUser()`, confirm the finding belongs to the user (`findings.id == findingId AND report.user_id == user.id` via join), read the file, validate the mime by magic-byte sniff (png/jpeg/webp only), reject if `> 2MB`, insert a `finding_images` row (`data`, `mime_type`, `byte_size`, next `sort_order`). Return the new row's `{id, caption, sort_order}` (never the bytes).
- Enforce a max of **20 images per finding** (count check before insert).

### 4.3 Manage (caption / reorder / delete)
- Server actions in `src/app/actions/finding-images.ts`: `updateImageCaption(imageId, caption)`, `reorderImages(findingId, orderedIds[])`, `deleteImage(imageId)` — each auth-checked via the finding→report→user ownership join. Revalidate the report page.

### 4.4 Serve (app UI)
- Route handler `GET /api/finding-images/[id]` (runtime nodejs): `requireUser()`, ownership-check, stream `data` with `Content-Type: mime_type`, `Cache-Control: private, max-age=60`. 404 on not-found/not-owner (no existence leak).
- The finding card + finding form render thumbnails via `<img src="/api/findings/images/{id}">` with caption, plus reorder handles + delete.

### 4.5 PDF embedding
- The export route (`reports/[id]/export/route.tsx`) additionally fetches `finding_images` for the report's findings (ordered), converts each `data` Buffer → `data:${mime};base64,${b64}` URI.
- `report-document.tsx`: import `Image` from `@react-pdf/renderer`; after the evidence `Text` for each finding, render its images — each as `<Image src={dataUri} style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }} />` with the caption as a small `<Text>` beneath. Cap total images per finding in the PDF at the stored max (20).

### 4.6 Validation / limits (constants)
`MAX_IMAGE_BYTES = 2_000_000`, `MAX_IMAGES_PER_FINDING = 20`, `ALLOWED_IMAGE_MIME = ['image/png','image/jpeg','image/webp']`. Add a Zod schema for caption (`max 300`). Magic-byte sniff (don't trust the client's declared type).

### 4.7 Migrations (dual lineage)
- Add the table to `src/lib/db/schema.ts` (with the `bytea` custom type).
- Cloud: `supabase/migrations/<ts>_finding_images.sql` (CREATE TABLE + index). Applied to the live cloud DB **at merge/deploy**, not before.
- Self-hosted: regenerate the drizzle baseline (`pnpm drizzle-kit generate --config drizzle.config.selfhosted.ts`).

---

## 5. Error handling
- Oversized / wrong-type upload → 400 with a clear message shown inline in the form; the other images in the batch still upload.
- Per-image upload failure is isolated (one bad paste doesn't lose the rest).
- PDF: if an image fails to decode, skip it (log) rather than failing the whole render.
- All mutations are ownership-checked; the serve route 404s for non-owners (no IDOR, no existence leak).

## 6. Testing
- Unit: mime sniff + size/count validation; caption Zod; ownership guard (rejects another user's finding); data-URI conversion helper.
- Integration (mocked db): upload inserts a row with correct sort_order; reorder updates order; delete cascades; serve route streams correct content-type + 404s non-owner.
- PDF: a finding with N images renders N `<Image>` nodes (snapshot/structure assertion against the react-pdf tree where feasible).
- `pnpm test`, `pnpm tsc --noEmit`, `pnpm build` clean.

## 7. Success criteria
1. A user can paste/drag/pick screenshots onto a finding, caption + reorder them, and delete them.
2. Images persist as `bytea` and are served only to their owner.
3. The exported PDF shows the screenshots (with captions) under each finding's evidence.
4. Works identically on cloud and self-hosted (no storage backend to configure).
5. Hard caps enforced server-side (type/size/count); a malformed upload can't crash the form or the PDF.
6. Build/test/types clean.

## 8. Deliberately deferred
- `sharp` server-side re-encode + EXIF strip (future hardening).
- Image markup/annotation in-app.
- Pro-gating uploads (revisit only if storage abuse appears).
