'use client'

import { useFormStatus } from 'react-dom'
import { createFinding } from '@/app/actions/findings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return <Button type="submit" size="sm" disabled={pending}>{pending ? 'Saving…' : label}</Button>
}

export function FindingForm({ reportId }: { reportId: string }) {
  const action = createFinding.bind(null, reportId)

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Add Finding</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1 space-y-1">
              <Label htmlFor="cvssScore">CVSS Score</Label>
              <Input id="cvssScore" name="cvssScore" type="number" min="0" max="10" step="0.1" defaultValue="0.0" />
            </div>
            <div className="col-span-3 space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={2} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="impact">Impact</Label>
            <Textarea id="impact" name="impact" rows={2} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="recommendation">Recommendation</Label>
            <Textarea id="recommendation" name="recommendation" rows={2} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="evidence">Evidence</Label>
            <Textarea id="evidence" name="evidence" rows={3} placeholder="Paste output, URLs, or notes…" />
          </div>
          <SubmitButton label="Add Finding" />
        </form>
      </CardContent>
    </Card>
  )
}
