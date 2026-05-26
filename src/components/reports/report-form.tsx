'use client'

import { useFormStatus } from 'react-dom'
import { createReport } from '@/app/actions/reports'
import { Field } from '@/components/penpad/ui'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn btn-accent" disabled={pending}>
      {pending ? 'Creating…' : 'Create Report'}
    </button>
  )
}

export function ReportForm() {
  return (
    <div style={{ maxWidth: '520px', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '24px', background: 'var(--bg)' }}>
      <form action={createReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Field label="Client name">
          <input className="input" name="clientName" required placeholder="e.g. Acme Corp" />
        </Field>
        <Field label="Scope" optional>
          <textarea className="textarea" name="scope" rows={3} placeholder="IP ranges, domains, app URLs…" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Start date" optional>
            <input className="input" name="startDate" type="date" />
          </Field>
          <Field label="End date" optional>
            <input className="input" name="endDate" type="date" />
          </Field>
        </div>
        <Field label="Tester name" optional>
          <input className="input" name="testerName" placeholder="e.g. Jamie Foster" />
        </Field>
        <div>
          <SubmitButton />
        </div>
      </form>
    </div>
  )
}
