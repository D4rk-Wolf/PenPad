'use client'

import { useFormStatus } from 'react-dom'
import { createReport } from '@/app/actions/reports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create Report'}</Button>
}

export function ReportForm() {
  return (
    <Card className="max-w-lg">
      <CardHeader><CardTitle>New Report</CardTitle></CardHeader>
      <CardContent>
        <form action={createReport} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input id="clientName" name="clientName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scope">Scope</Label>
            <Textarea id="scope" name="scope" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="testerName">Tester Name</Label>
            <Input id="testerName" name="testerName" />
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
