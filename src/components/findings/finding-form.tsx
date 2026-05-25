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
