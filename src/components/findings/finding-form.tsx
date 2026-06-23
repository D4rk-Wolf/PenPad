'use client'

import { useState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { createFinding } from '@/app/actions/findings'
import { draftFinding } from '@/app/actions/ai'
import { CURATED_TEMPLATES } from '@/lib/templates'
import { Field } from '@/components/penpad/ui'
import type { FindingTemplate } from '@/lib/db/schema'

type Fields = {
  title: string
  affectedComponent?: string
  cvssScore: string
  description: string
  impact: string
  recommendation: string
  evidence: string
}

const EMPTY: Fields = {
  title: '', affectedComponent: '', cvssScore: '0.0', description: '', impact: '', recommendation: '', evidence: '',
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-accent btn-sm" disabled={pending}>
      {pending ? 'Saving…' : 'Add Finding'}
    </button>
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
  aiEnabled,
}: {
  reportId: string
  myTemplates: FindingTemplate[]
  isPro: boolean
  aiEnabled: boolean
}) {
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [error, setError]   = useState<string | null>(null)
  const action = createFinding.bind(null, reportId)

  const [aiNotes, setAiNotes]   = useState('')
  const [aiError, setAiError]   = useState<string | null>(null)
  const [isDrafting, startDraft] = useTransition()

  function fillField(key: 'description' | 'impact' | 'recommendation', value: string) {
    setFields(f => {
      const current = f[key]
      if (current.trim() && !confirm(`Replace the existing ${key}?`)) return f
      return { ...f, [key]: value }
    })
  }

  function handleDraft() {
    setAiError(null)
    if (!fields.title.trim()) {
      setAiError('Enter a title first, then draft with AI.')
      return
    }
    startDraft(async () => {
      try {
        const draft = await draftFinding({
          title: fields.title,
          affectedComponent: fields.affectedComponent ?? null,
          notes: aiNotes || null,
        })
        fillField('description', draft.description)
        fillField('impact', draft.impact)
        fillField('recommendation', draft.recommendation)
      } catch (err) {
        setAiError(err instanceof Error ? err.message : 'AI drafting failed — please try again.')
      }
    })
  }

  function applyTemplate(t: TemplateLike) {
    setFields({
      title:             t.title,
      affectedComponent: '',
      cvssScore:         t.cvssScore != null ? String(t.cvssScore) : '0.0',
      description:       t.description ?? '',
      impact:            t.impact ?? '',
      recommendation:    t.recommendation ?? '',
      evidence:          '',
    })
  }

  async function handleAction(formData: FormData) {
    setError(null)
    try {
      await action(formData)
      setFields(EMPTY)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save finding. Please try again.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Field label="Use template">
        <select
          className="select"
          defaultValue=""
          onChange={e => {
            const val = e.target.value
            if (!val) return
            const colonIdx = val.indexOf(':')
            const type = val.slice(0, colonIdx)
            const key = val.slice(colonIdx + 1)
            if (type === 'c') applyTemplate(CURATED_TEMPLATES[Number(key)])
            else if (type === 'm') {
              const t = myTemplates.find(t => t.id === key)
              if (t) applyTemplate(t)
            }
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
                ? myTemplates.map(t => (
                    <option key={t.id} value={`m:${t.id}`}>{t.title}</option>
                  ))
                : [<option key="empty" disabled>No saved templates yet</option>]
              : [<option key="upgrade" disabled>Upgrade to Pro to save templates</option>]
            }
          </optgroup>
        </select>
      </Field>

      <form action={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Field label="Title">
          <input
            className="input"
            name="title"
            required
            value={fields.title}
            onChange={e => setFields(f => ({ ...f, title: e.target.value }))}
          />
        </Field>

        <Field label="Affected component" optional>
          <input
            className="input"
            name="affectedComponent"
            value={fields.affectedComponent ?? ''}
            onChange={e => setFields(f => ({ ...f, affectedComponent: e.target.value }))}
            placeholder="e.g. /api/v1/login"
          />
        </Field>

        {aiEnabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--bg-subtle, transparent)' }}>
            <Field label="Context for AI" optional>
              <textarea
                className="textarea"
                rows={2}
                value={aiNotes}
                onChange={e => setAiNotes(e.target.value)}
                placeholder="Optional notes to steer the draft (e.g. observed behaviour, affected data)…"
              />
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={handleDraft}
                disabled={isDrafting}
              >
                {isDrafting ? 'Drafting…' : '✨ Draft with AI'}
              </button>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--fg-muted)' }}>
                AI draft — review before sending.
              </span>
            </div>
            {aiError && (
              <p role="alert" style={{ fontSize: 'var(--fs-sm)', color: 'var(--sev-critical)', margin: 0 }}>
                {aiError}
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '12px' }}>
          <Field label="CVSS">
            <input
              className="input"
              name="cvssScore"
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={fields.cvssScore}
              onChange={e => setFields(f => ({ ...f, cvssScore: e.target.value }))}
            />
          </Field>
          <Field label="Description">
            <textarea
              className="textarea"
              name="description"
              rows={2}
              value={fields.description}
              onChange={e => setFields(f => ({ ...f, description: e.target.value }))}
            />
          </Field>
        </div>

        <Field label="Impact">
          <textarea
            className="textarea"
            name="impact"
            rows={2}
            value={fields.impact}
            onChange={e => setFields(f => ({ ...f, impact: e.target.value }))}
          />
        </Field>

        <Field label="Recommendation">
          <textarea
            className="textarea"
            name="recommendation"
            rows={2}
            value={fields.recommendation}
            onChange={e => setFields(f => ({ ...f, recommendation: e.target.value }))}
          />
        </Field>

        <Field label="Evidence" optional>
          <textarea
            className="textarea"
            name="evidence"
            rows={3}
            placeholder="Paste output, URLs, or notes…"
            value={fields.evidence}
            onChange={e => setFields(f => ({ ...f, evidence: e.target.value }))}
          />
        </Field>

        {error && (
          <p role="alert" style={{ fontSize: 'var(--fs-sm)', color: 'var(--sev-critical)', margin: '0' }}>
            {error}
          </p>
        )}
        <div>
          <SubmitButton />
        </div>
      </form>
    </div>
  )
}
