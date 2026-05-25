# Finding Templates Design

## Goal

Allow pen testers to pick from a curated library of common findings and save their own custom templates, reducing time spent on repetitive finding entry.

## Architecture

**Curated templates** live in `src/lib/templates.ts` as a hardcoded typed array — no DB table, no seed migration. Updated via code deploy.

**Custom templates** live in a `finding_templates` Supabase table scoped to `user_id`. Pro-only feature.

## Data Model

New table: `finding_templates`

```sql
CREATE TABLE finding_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  cvss_score      numeric(3,1),
  severity        text,
  impact          text,
  recommendation  text,
  evidence        text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE finding_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own templates"
  ON finding_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

Schema type added to `src/lib/db/schema.ts`.

## Curated Library

~20 findings in `src/lib/templates.ts`, grouped into 3 categories:

- **OWASP Web Top 10** — 10 entries (SQL Injection, XSS, Broken Access Control, etc.)
- **OWASP API Top 10** — 5 entries (Broken Object Level Auth, Excessive Data Exposure, etc.)
- **Infrastructure** — 5 entries (Default Credentials, Unpatched OS, Open Admin Ports, etc.)

Each entry has: `category`, `title`, `description`, `cvssScore`, `severity`, `impact`, `recommendation`.

## Access Control

| Feature | Free | Pro |
|---|---|---|
| Browse & use curated templates | ✅ | ✅ |
| Save finding as custom template | ❌ | ✅ |
| Use custom templates | ❌ | ✅ |
| Delete custom templates | ❌ | ✅ |

Free users see the "My Templates" section with an upgrade CTA instead of their templates.

## UX Flow

### Using a template (report page)
1. Tester opens the Add Finding form on a report page
2. A "Use template" dropdown sits at the top of the form
3. Dropdown shows two groups: **Curated** (always visible) and **My Templates** (Pro; upgrade CTA if free)
4. Selecting a template pre-fills all form fields
5. Tester edits freely and saves — creates a normal finding, template is not mutated

### Saving a custom template (Pro)
1. On any finding card, a "Save as template" button (Pro-gated)
2. Clicking it calls `saveTemplate` server action — copies the finding's fields to `finding_templates`
3. Toast confirmation

### Managing custom templates
- `/templates` page lists user's custom templates (title + severity badge)
- Each row has a Delete button
- No edit — delete and re-save from a finding

## Files

| File | Change |
|---|---|
| `src/lib/templates.ts` | New — curated template data |
| `src/lib/db/schema.ts` | Add `findingTemplates` table + `FindingTemplate` type |
| `src/app/actions/templates.ts` | New — `getMyTemplates`, `saveTemplate`, `deleteTemplate` |
| `src/components/findings/finding-form.tsx` | Add template dropdown; pre-fill on select |
| `src/components/findings/finding-card.tsx` | Add Pro-gated "Save as template" button |
| `src/app/(app)/templates/page.tsx` | New — list + delete custom templates |
| `src/app/(app)/layout.tsx` | Add Templates nav link |
| Supabase migration | `finding_templates` table + RLS |

## Error Handling

- `saveTemplate` is a no-op if the user is not Pro (server-side check)
- `deleteTemplate` verifies `user_id` match before deleting
- Template dropdown gracefully handles empty custom template list
