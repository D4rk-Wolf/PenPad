# Finding Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a curated finding library (free) and user-saved custom templates (Pro) to the Add Finding form on the report page.

**Architecture:** Curated templates are a hardcoded TypeScript array — no DB needed. Custom templates live in a new `finding_templates` Supabase table. The Add Finding form gains a template dropdown that pre-fills all fields on selection. FindingCard gains a Pro-gated "Save as template" button. A `/templates` page lists and manages custom templates.

**Tech Stack:** Next.js 16 App Router, Supabase JS admin client (`@/lib/supabase/admin`), Vitest, shadcn/ui components, TypeScript.

---

## File Map

| File | Action |
|---|---|
| `src/lib/templates.ts` | **Create** — 20 curated findings in 3 categories |
| `src/lib/__tests__/templates.test.ts` | **Create** — unit tests for curated data |
| `src/lib/db/schema.ts` | **Modify** — add `findingTemplates` table + `FindingTemplate` type |
| `src/app/actions/templates.ts` | **Create** — `getMyTemplates`, `saveTemplate`, `deleteTemplate` |
| `src/components/findings/finding-form.tsx` | **Modify** — controlled inputs + template dropdown |
| `src/components/findings/finding-card.tsx` | **Modify** — add `isPro` prop + "Save as template" button |
| `src/app/(app)/templates/page.tsx` | **Create** — list + delete custom templates |
| `src/app/(app)/layout.tsx` | **Modify** — add Templates nav link |
| `src/app/(app)/reports/[id]/page.tsx` | **Modify** — fetch templates, pass to form + cards |

---

## Task 1: Apply DB Migration

**Files:**
- Supabase project: `vtdmtnpsybqmcgtdvblu`

- [ ] **Step 1: Apply the migration via Supabase MCP**

Run the following SQL against the `vtdmtnpsybqmcgtdvblu` project:

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
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Verify table exists**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'finding_templates'
ORDER BY ordinal_position;
```

Expected: 9 rows (id, user_id, title, description, cvss_score, severity, impact, recommendation, evidence, created_at).

- [ ] **Step 3: Commit**

```bash
git commit --allow-empty -m "chore: apply finding_templates migration to Supabase"
```

---

## Task 2: Curated Templates Data + Tests

**Files:**
- Create: `src/lib/templates.ts`
- Create: `src/lib/__tests__/templates.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/templates.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { CURATED_TEMPLATES, type CuratedTemplate } from '@/lib/templates'
import { deriveSeverity } from '@/lib/utils'

describe('CURATED_TEMPLATES', () => {
  it('has exactly 20 entries', () => {
    expect(CURATED_TEMPLATES).toHaveLength(20)
  })

  it('every entry has required string fields', () => {
    for (const t of CURATED_TEMPLATES) {
      expect(typeof t.title).toBe('string')
      expect(t.title.length).toBeGreaterThan(0)
      expect(typeof t.description).toBe('string')
      expect(typeof t.impact).toBe('string')
      expect(typeof t.recommendation).toBe('string')
    }
  })

  it('every cvssScore is between 0 and 10', () => {
    for (const t of CURATED_TEMPLATES) {
      expect(t.cvssScore).toBeGreaterThanOrEqual(0)
      expect(t.cvssScore).toBeLessThanOrEqual(10)
    }
  })

  it('severity matches deriveSeverity(cvssScore) for every entry', () => {
    for (const t of CURATED_TEMPLATES) {
      expect(t.severity).toBe(deriveSeverity(t.cvssScore))
    }
  })

  it('category is one of the three allowed values', () => {
    const allowed = ['OWASP Web', 'OWASP API', 'Infrastructure']
    for (const t of CURATED_TEMPLATES) {
      expect(allowed).toContain(t.category)
    }
  })

  it('has 10 OWASP Web, 5 OWASP API, and 5 Infrastructure entries', () => {
    const counts = CURATED_TEMPLATES.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1
      return acc
    }, {})
    expect(counts['OWASP Web']).toBe(10)
    expect(counts['OWASP API']).toBe(5)
    expect(counts['Infrastructure']).toBe(5)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd studios/products/PenPad && pnpm test
```

Expected: FAIL with "Cannot find module '@/lib/templates'"

- [ ] **Step 3: Create the curated templates file**

Create `src/lib/templates.ts`:

```typescript
import type { Severity } from '@/lib/utils'

export type CuratedTemplate = {
  category: 'OWASP Web' | 'OWASP API' | 'Infrastructure'
  title: string
  description: string
  cvssScore: number
  severity: Severity
  impact: string
  recommendation: string
}

export const CURATED_TEMPLATES: CuratedTemplate[] = [
  // ── OWASP Web Top 10 ─────────────────────────────────────────────────────
  {
    category:       'OWASP Web',
    title:          'SQL Injection',
    cvssScore:      9.8,
    severity:       'critical',
    description:    'User-supplied input is incorporated into SQL queries without adequate sanitisation, allowing an attacker to manipulate query logic.',
    impact:         'Complete compromise of the database; potential for authentication bypass, data exfiltration, data modification, or OS command execution.',
    recommendation: 'Use parameterised queries or prepared statements. Apply an ORM that escapes inputs by default. Validate and whitelist input where possible.',
  },
  {
    category:       'OWASP Web',
    title:          'Reflected Cross-Site Scripting (XSS)',
    cvssScore:      7.2,
    severity:       'high',
    description:    'User-supplied input is reflected in HTTP responses without encoding, allowing injection of arbitrary JavaScript that executes in a victim\'s browser.',
    impact:         'Session hijacking, credential theft, redirection to malicious sites, and page defacement.',
    recommendation: 'Encode all output using context-aware encoding (HTML, JS, CSS, URL). Implement a strict Content-Security-Policy header.',
  },
  {
    category:       'OWASP Web',
    title:          'Broken Access Control',
    cvssScore:      8.1,
    severity:       'high',
    description:    'The application fails to enforce access restrictions, allowing authenticated users to access resources or perform actions beyond their intended privileges.',
    impact:         'Horizontal or vertical privilege escalation; unauthorised data access or modification.',
    recommendation: 'Enforce access control on the server side for every request. Apply deny-by-default. Log and alert on access control failures.',
  },
  {
    category:       'OWASP Web',
    title:          'Sensitive Data Exposure',
    cvssScore:      7.5,
    severity:       'high',
    description:    'The application transmits or stores sensitive data (credentials, PII, payment data) without adequate encryption or protection.',
    impact:         'Exposure of credentials, personal data, or payment card information leading to fraud or regulatory breach.',
    recommendation: 'Encrypt sensitive data at rest and in transit using modern algorithms (AES-256, TLS 1.2+). Avoid storing sensitive data unless necessary.',
  },
  {
    category:       'OWASP Web',
    title:          'Security Misconfiguration',
    cvssScore:      6.5,
    severity:       'medium',
    description:    'The server, framework, or application is misconfigured, exposing sensitive functionality or information such as debug pages, default credentials, or verbose error messages.',
    impact:         'Information disclosure and unauthorised access to administrative functionality.',
    recommendation: 'Harden all environments. Disable debug features in production. Remove default accounts. Review configuration against CIS benchmarks.',
  },
  {
    category:       'OWASP Web',
    title:          'Vulnerable and Outdated Components',
    cvssScore:      7.2,
    severity:       'high',
    description:    'The application uses third-party libraries or frameworks with known, publicly disclosed vulnerabilities.',
    impact:         'Exploitation of known CVEs affecting underlying components, potentially leading to RCE, data exposure, or denial of service.',
    recommendation: 'Maintain a software bill of materials (SBOM). Monitor CVE feeds. Automate dependency updates using Dependabot or Snyk.',
  },
  {
    category:       'OWASP Web',
    title:          'Broken Authentication',
    cvssScore:      8.8,
    severity:       'high',
    description:    'Authentication mechanisms are implemented incorrectly, allowing attackers to compromise passwords, keys, or session tokens.',
    impact:         'Account takeover, user impersonation, and session hijacking.',
    recommendation: 'Enforce multi-factor authentication. Use secure password storage (bcrypt/argon2). Implement short-lived session tokens with proper invalidation on logout.',
  },
  {
    category:       'OWASP Web',
    title:          'Insecure Deserialisation',
    cvssScore:      7.7,
    severity:       'high',
    description:    'The application deserialises untrusted data without adequate validation, potentially leading to remote code execution or privilege escalation.',
    impact:         'Remote code execution, privilege escalation, and replay attacks.',
    recommendation: 'Avoid deserialising data from untrusted sources. Use data-only formats such as JSON. Implement integrity checks on serialised objects.',
  },
  {
    category:       'OWASP Web',
    title:          'Insufficient Logging and Monitoring',
    cvssScore:      4.3,
    severity:       'medium',
    description:    'Security-relevant events are not logged, monitored, or alerted on, allowing attacks to proceed undetected.',
    impact:         'Delayed detection of breaches, inability to investigate incidents, and non-compliance with regulatory requirements.',
    recommendation: 'Log authentication events, access control failures, and input validation failures. Centralise logs. Implement alerting for anomalous patterns.',
  },
  {
    category:       'OWASP Web',
    title:          'Server-Side Request Forgery (SSRF)',
    cvssScore:      8.6,
    severity:       'high',
    description:    'The application fetches remote resources based on user-supplied URLs without adequate validation, allowing requests to be directed to internal services.',
    impact:         'Access to internal metadata services, internal network scanning, and credential theft from cloud IMDS endpoints (e.g. AWS IMDSv1).',
    recommendation: 'Validate and whitelist allowed URLs. Block requests to private IP ranges. Disable HTTP redirects. Use an allowlist of approved domains.',
  },

  // ── OWASP API Top 10 ─────────────────────────────────────────────────────
  {
    category:       'OWASP API',
    title:          'Broken Object Level Authorisation (BOLA / IDOR)',
    cvssScore:      8.1,
    severity:       'high',
    description:    'API endpoints access objects using IDs supplied by the client without verifying the requesting user has permission to access that specific object.',
    impact:         'Horizontal privilege escalation; any authenticated user can access or modify another user\'s resources.',
    recommendation: 'Validate that the authenticated user is authorised to access the requested object on every API call. Do not rely on the obscurity of object IDs.',
  },
  {
    category:       'OWASP API',
    title:          'Broken API Authentication',
    cvssScore:      9.0,
    severity:       'critical',
    description:    'API authentication mechanisms are weak or absent, allowing unauthenticated access to protected endpoints.',
    impact:         'Full unauthorised access to user data or sensitive application functionality.',
    recommendation: 'Enforce authentication on all protected endpoints. Use short-lived tokens (JWT with expiry). Rotate API keys on compromise.',
  },
  {
    category:       'OWASP API',
    title:          'Broken Object Property Level Authorisation',
    cvssScore:      6.5,
    severity:       'medium',
    description:    'The API returns more object properties than the client should access, or allows writing to properties that should be read-only, enabling mass assignment attacks.',
    impact:         'Exposure of sensitive fields or privilege escalation via mass assignment of privileged properties.',
    recommendation: 'Define response schemas explicitly. Whitelist accepted input fields. Never auto-bind all input properties to internal objects.',
  },
  {
    category:       'OWASP API',
    title:          'Unrestricted Resource Consumption',
    cvssScore:      5.3,
    severity:       'medium',
    description:    'The API imposes no limits on request size, frequency, or resource usage, enabling resource exhaustion attacks.',
    impact:         'Denial of service, excessive cloud infrastructure costs, and degraded availability for legitimate users.',
    recommendation: 'Implement rate limiting per user and per IP. Limit request payload size. Apply pagination to all list endpoints.',
  },
  {
    category:       'OWASP API',
    title:          'Broken Function Level Authorisation',
    cvssScore:      8.1,
    severity:       'high',
    description:    'Administrative or privileged API functions are accessible to lower-privilege users due to missing server-side authorisation checks.',
    impact:         'Vertical privilege escalation; unprivileged users can invoke admin-only functionality.',
    recommendation: 'Enforce function-level authorisation on the server side. Apply deny-by-default. Audit all endpoints for missing authorisation checks.',
  },

  // ── Infrastructure ────────────────────────────────────────────────────────
  {
    category:       'Infrastructure',
    title:          'Default Credentials',
    cvssScore:      9.8,
    severity:       'critical',
    description:    'An administrative interface or service is accessible using vendor-default credentials that have not been changed.',
    impact:         'Full administrative access to the affected system or service with no prior knowledge required.',
    recommendation: 'Change all default credentials immediately on deployment. Maintain a credential inventory process for all managed systems and services.',
  },
  {
    category:       'Infrastructure',
    title:          'Unpatched Operating System',
    cvssScore:      8.1,
    severity:       'high',
    description:    'The operating system is running with known, unpatched vulnerabilities for which public exploits are available.',
    impact:         'Local or remote code execution and privilege escalation, depending on the specific CVE.',
    recommendation: 'Apply OS security patches within 30 days of release (7 days for critical severity). Implement automated patching. Use a vulnerability scanner for ongoing monitoring.',
  },
  {
    category:       'Infrastructure',
    title:          'Exposed Administrative Services',
    cvssScore:      7.2,
    severity:       'high',
    description:    'Administrative services (SSH, RDP, database ports) are directly exposed to the internet without IP restriction.',
    impact:         'Brute-force and credential stuffing attacks, and exploitation of service-layer vulnerabilities.',
    recommendation: 'Restrict administrative ports to trusted IP ranges or a VPN. Implement network-level access controls (security groups, firewall rules).',
  },
  {
    category:       'Infrastructure',
    title:          'Insecure Network Protocols',
    cvssScore:      6.5,
    severity:       'medium',
    description:    'Unencrypted protocols such as Telnet, FTP, or plain HTTP are in use, transmitting data — including credentials — in cleartext.',
    impact:         'Credential interception, session hijacking, and data theft via network sniffing.',
    recommendation: 'Disable Telnet, FTP, and plain HTTP. Replace with SSH, SFTP/FTPS, and HTTPS respectively. Enforce TLS 1.2 minimum.',
  },
  {
    category:       'Infrastructure',
    title:          'Missing HTTP Security Headers',
    cvssScore:      4.3,
    severity:       'medium',
    description:    'HTTP security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) are absent, leaving the application vulnerable to browser-based attacks.',
    impact:         'Clickjacking, MIME-type sniffing, protocol downgrade attacks, and amplified XSS risk.',
    recommendation: 'Implement HSTS, Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, and Referrer-Policy. Validate using securityheaders.com.',
  },
]
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/templates.ts src/lib/__tests__/templates.test.ts
git commit -m "feat: add curated finding templates library with tests"
```

---

## Task 3: Schema Types

**Files:**
- Modify: `src/lib/db/schema.ts`

- [ ] **Step 1: Add the findingTemplates table definition**

Append to `src/lib/db/schema.ts` (after the `subscriptions` block, before the type exports):

```typescript
export const findingTemplates = pgTable('finding_templates', {
  id:             uuid('id').primaryKey().defaultRandom(),
  userId:         uuid('user_id').notNull(),
  title:          text('title').notNull(),
  description:    text('description'),
  cvssScore:      numeric('cvss_score', { precision: 3, scale: 1 }),
  severity:       text('severity'),
  impact:         text('impact'),
  recommendation: text('recommendation'),
  evidence:       text('evidence'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type FindingTemplate  = typeof findingTemplates.$inferSelect
export type NewFindingTemplate = typeof findingTemplates.$inferInsert
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | tail -5
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/schema.ts
git commit -m "feat: add findingTemplates schema type"
```

---

## Task 4: Template Server Actions

**Files:**
- Create: `src/app/actions/templates.ts`

- [ ] **Step 1: Create the actions file**

Create `src/app/actions/templates.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { adminDb, camel } from '@/lib/supabase/admin'
import { getSubscription } from '@/app/actions/reports'
import type { FindingTemplate, Finding } from '@/lib/db/schema'

export async function getMyTemplates(): Promise<FindingTemplate[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await adminDb
    .from('finding_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(r => camel<FindingTemplate>(r as Record<string, unknown>))
}

export async function saveTemplate(findingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const sub = await getSubscription(user.id)
  if (sub?.status !== 'active') return

  const { data: findingRow } = await adminDb
    .from('findings')
    .select('*')
    .eq('id', findingId)
    .maybeSingle()
  if (!findingRow) return

  const { data: reportRow } = await adminDb
    .from('reports')
    .select('id')
    .eq('id', findingRow.report_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!reportRow) return

  const f = camel<Finding>(findingRow as Record<string, unknown>)

  await adminDb.from('finding_templates').insert({
    user_id:        user.id,
    title:          f.title,
    description:    f.description,
    cvss_score:     f.cvssScore,
    severity:       f.severity,
    impact:         f.impact,
    recommendation: f.recommendation,
    evidence:       f.evidence,
  })

  revalidatePath('/templates')
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await adminDb
    .from('finding_templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', user.id)

  revalidatePath('/templates')
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | tail -5
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/templates.ts
git commit -m "feat: add template server actions (getMyTemplates, saveTemplate, deleteTemplate)"
```

---

## Task 5: Update FindingForm with Template Dropdown

**Files:**
- Modify: `src/components/findings/finding-form.tsx`

The form converts from uncontrolled to controlled inputs so a selected template can pre-fill all fields. The template dropdown sits above the form. After a successful submission the fields reset to empty.

- [ ] **Step 1: Replace the entire file**

```typescript
'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createFinding } from '@/app/actions/findings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CURATED_TEMPLATES } from '@/lib/templates'
import type { FindingTemplate } from '@/lib/db/schema'

type Fields = {
  title: string
  cvssScore: string
  description: string
  impact: string
  recommendation: string
  evidence: string
}

const EMPTY: Fields = {
  title: '', cvssScore: '0.0', description: '', impact: '', recommendation: '', evidence: '',
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Saving…' : 'Add Finding'}
    </Button>
  )
}

type TemplateLike = {
  title: string
  description?: string | null
  cvssScore?: number | string | null
  impact?: string | null
  recommendation?: string | null
}

export function FindingForm({
  reportId,
  myTemplates,
  isPro,
}: {
  reportId: string
  myTemplates: FindingTemplate[]
  isPro: boolean
}) {
  const [fields, setFields] = useState<Fields>(EMPTY)
  const action = createFinding.bind(null, reportId)

  function applyTemplate(t: TemplateLike) {
    setFields({
      title:          t.title,
      cvssScore:      t.cvssScore != null ? String(t.cvssScore) : '0.0',
      description:    t.description ?? '',
      impact:         t.impact ?? '',
      recommendation: t.recommendation ?? '',
      evidence:       '',
    })
  }

  async function handleAction(formData: FormData) {
    await action(formData)
    setFields(EMPTY)
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Add Finding</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-1 mb-4">
          <Label htmlFor="template-select">Use template</Label>
          <select
            id="template-select"
            defaultValue=""
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            onChange={e => {
              const val = e.target.value
              if (!val) return
              const [type, idx] = val.split(':')
              if (type === 'c') applyTemplate(CURATED_TEMPLATES[Number(idx)])
              else if (type === 'm') applyTemplate(myTemplates[Number(idx)])
              e.currentTarget.value = ''
            }}
          >
            <option value="">— pick a template —</option>
            <optgroup label="Curated">
              {CURATED_TEMPLATES.map((t, i) => (
                <option key={i} value={`c:${i}`}>{t.title}</option>
              ))}
            </optgroup>
            <optgroup label="My Templates">
              {isPro
                ? myTemplates.length > 0
                  ? myTemplates.map((t, i) => (
                      <option key={t.id} value={`m:${i}`}>{t.title}</option>
                    ))
                  : [<option key="empty" disabled>No saved templates yet</option>]
                : [<option key="upgrade" disabled>Upgrade to Pro to save templates</option>]
              }
            </optgroup>
          </select>
        </div>

        <form action={handleAction} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title" name="title" required
              value={fields.title}
              onChange={e => setFields(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1 space-y-1">
              <Label htmlFor="cvssScore">CVSS Score</Label>
              <Input
                id="cvssScore" name="cvssScore" type="number" min="0" max="10" step="0.1"
                value={fields.cvssScore}
                onChange={e => setFields(f => ({ ...f, cvssScore: e.target.value }))}
              />
            </div>
            <div className="col-span-3 space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description" name="description" rows={2}
                value={fields.description}
                onChange={e => setFields(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="impact">Impact</Label>
            <Textarea
              id="impact" name="impact" rows={2}
              value={fields.impact}
              onChange={e => setFields(f => ({ ...f, impact: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="recommendation">Recommendation</Label>
            <Textarea
              id="recommendation" name="recommendation" rows={2}
              value={fields.recommendation}
              onChange={e => setFields(f => ({ ...f, recommendation: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="evidence">Evidence</Label>
            <Textarea
              id="evidence" name="evidence" rows={3} placeholder="Paste output, URLs, or notes…"
              value={fields.evidence}
              onChange={e => setFields(f => ({ ...f, evidence: e.target.value }))}
            />
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | tail -5
```

Expected: no TypeScript errors. (Note: the report page will show a type error on `<FindingForm>` because it now requires `myTemplates` and `isPro` props — fix that in Task 8.)

- [ ] **Step 3: Commit**

```bash
git add src/components/findings/finding-form.tsx
git commit -m "feat: add template dropdown to FindingForm with controlled inputs"
```

---

## Task 6: FindingCard "Save as Template" Button

**Files:**
- Modify: `src/components/findings/finding-card.tsx`

Add a Pro-gated "Save as template" form button at the bottom of each card.

- [ ] **Step 1: Replace the entire file**

```typescript
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteFinding } from '@/app/actions/findings'
import { saveTemplate } from '@/app/actions/templates'
import { SEVERITY_COLOURS } from '@/lib/utils'
import type { Finding } from '@/lib/db/schema'
import type { Severity } from '@/lib/utils'

export function FindingCard({
  finding,
  reportId,
  isPro,
}: {
  finding: Finding
  reportId: string
  isPro: boolean
}) {
  const severity = (finding.severity ?? 'info') as Severity

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{finding.title}</CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEVERITY_COLOURS[severity]}`}>
              {severity.toUpperCase()}
            </span>
            <span className="text-xs text-muted-foreground">
              CVSS {Number(finding.cvssScore).toFixed(1)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {finding.description && (
          <div><span className="font-medium">Description: </span>{finding.description}</div>
        )}
        {finding.impact && (
          <div><span className="font-medium">Impact: </span>{finding.impact}</div>
        )}
        {finding.recommendation && (
          <div><span className="font-medium">Recommendation: </span>{finding.recommendation}</div>
        )}
        {finding.evidence && (
          <pre className="bg-muted p-2 rounded text-xs overflow-auto">{finding.evidence}</pre>
        )}
        <div className="flex items-center gap-2 pt-1">
          <form action={deleteFinding.bind(null, finding.id, reportId)}>
            <Button variant="ghost" size="sm" type="submit"
              className="text-destructive hover:text-destructive h-7 px-2">
              Remove
            </Button>
          </form>
          {isPro && (
            <form action={saveTemplate.bind(null, finding.id)}>
              <Button variant="ghost" size="sm" type="submit" className="h-7 px-2">
                Save as template
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/findings/finding-card.tsx
git commit -m "feat: add Pro-gated Save as template button to FindingCard"
```

---

## Task 7: Templates Management Page + Nav Link

**Files:**
- Create: `src/app/(app)/templates/page.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Create the templates page**

Create `src/app/(app)/templates/page.tsx`:

```typescript
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getMyTemplates, deleteTemplate } from '@/app/actions/templates'
import { getSubscription } from '@/app/actions/reports'
import { Button } from '@/components/ui/button'
import { SEVERITY_COLOURS } from '@/lib/utils'
import type { Severity } from '@/lib/utils'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const sub = await getSubscription(user!.id)
  const isPro = sub?.status === 'active'
  const templates = isPro ? await getMyTemplates() : []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Templates</h1>
          {!isPro && (
            <p className="text-sm text-muted-foreground mt-1">
              Custom templates are a Pro feature.{' '}
              <Link href="/settings" className="underline hover:text-foreground">
                Upgrade to Pro
              </Link>
            </p>
          )}
        </div>
      </div>

      {isPro && templates.length === 0 && (
        <p className="text-muted-foreground text-center py-12">
          No templates yet. On any finding card, click &quot;Save as template&quot; to add one.
        </p>
      )}

      <div className="space-y-3 max-w-2xl">
        {templates.map(t => {
          const severity = (t.severity ?? 'info') as Severity
          return (
            <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEVERITY_COLOURS[severity]}`}>
                  {severity.toUpperCase()}
                </span>
                <span className="font-medium text-sm">{t.title}</span>
              </div>
              <form action={deleteTemplate.bind(null, t.id)}>
                <Button
                  variant="ghost" size="sm" type="submit"
                  className="text-destructive hover:text-destructive h-7 px-2"
                >
                  Delete
                </Button>
              </form>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add the Templates nav link to layout**

In `src/app/(app)/layout.tsx`, add the Templates link between Reports and Settings:

```typescript
// Replace the nav section (lines 24-29) with:
<nav className="flex items-center gap-4">
  <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
    Reports
  </Link>
  <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">
    Templates
  </Link>
  <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">
    Settings
  </Link>
  <form action={signOut}>
    <Button variant="ghost" size="sm" type="submit">Sign out</Button>
  </form>
</nav>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/templates/page.tsx src/app/(app)/layout.tsx
git commit -m "feat: add templates management page and nav link"
```

---

## Task 8: Wire Report Page

**Files:**
- Modify: `src/app/(app)/reports/[id]/page.tsx`

Pass `myTemplates` and `isPro` to `FindingForm`. Pass `isPro` to each `FindingCard`.

- [ ] **Step 1: Update the report page**

Replace the entire file `src/app/(app)/reports/[id]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { adminDb, camel } from '@/lib/supabase/admin'
import type { Report } from '@/lib/db/schema'
import { getFindings } from '@/app/actions/findings'
import { getSubscription } from '@/app/actions/reports'
import { getMyTemplates } from '@/app/actions/templates'
import { FindingForm } from '@/components/findings/finding-form'
import { FindingCard } from '@/components/findings/finding-card'
import { Button } from '@/components/ui/button'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: reportRow } = await adminDb
    .from('reports')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .maybeSingle()
  if (!reportRow) notFound()
  const report = camel<Report>(reportRow as Record<string, unknown>)

  const [findingList, sub, myTemplates] = await Promise.all([
    getFindings(id),
    getSubscription(user!.id),
    getMyTemplates(),
  ])
  const isPro = sub?.status === 'active'

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
  const sorted = [...findingList].sort((a, b) =>
    (severityOrder[a.severity as keyof typeof severityOrder] ?? 4) -
    (severityOrder[b.severity as keyof typeof severityOrder] ?? 4)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{report.clientName}</h1>
          {report.scope && <p className="text-sm text-muted-foreground mt-1">{report.scope}</p>}
        </div>
        <div className="flex items-center gap-3">
          {isPro ? (
            <Button render={<Link href={`/reports/${id}/export`} target="_blank" />}>
              Export PDF
            </Button>
          ) : (
            <Button variant="outline" render={<Link href="/settings" />}>
              Upgrade for PDF export
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold mb-4">Findings ({findingList.length})</h2>
          <div className="space-y-3">
            {sorted.map(finding => (
              <FindingCard key={finding.id} finding={finding} reportId={id} isPro={isPro} />
            ))}
            {findingList.length === 0 && (
              <p className="text-muted-foreground text-sm">No findings yet.</p>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Add Finding</h2>
          <FindingForm reportId={id} myTemplates={myTemplates} isPro={isPro} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run full test suite**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 3: Run build to verify no TypeScript errors**

```bash
pnpm build 2>&1 | tail -10
```

Expected: build succeeds, no type errors.

- [ ] **Step 4: Verify dev server manually**

Start dev server if not running: `pnpm dev`

Check:
1. Open a report page — the Add Finding form has a "Use template" dropdown
2. Select a curated template — all fields pre-fill
3. Submit — finding is added, form resets to empty
4. On a finding card, "Save as template" button is visible (Pro account)
5. Click "Save as template" — navigate to `/templates` and confirm the template appears
6. On `/templates`, click Delete — template is removed
7. Back on the report page, custom template appears in the "My Templates" optgroup

- [ ] **Step 5: Final commit**

```bash
git add src/app/(app)/reports/[id]/page.tsx
git commit -m "feat: wire templates into report page — pass myTemplates and isPro to form and cards"
```

- [ ] **Step 6: Push**

```bash
git push
```
