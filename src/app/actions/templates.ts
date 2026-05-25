'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { adminDb(), camel } from '@/lib/supabase/admin'
import { getSubscription } from '@/app/actions/reports'
import type { FindingTemplate, Finding } from '@/lib/db/schema'

export async function getMyTemplates(): Promise<FindingTemplate[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await adminDb()
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

  const { data: findingRow } = await adminDb()
    .from('findings')
    .select('*, reports!inner(user_id)')
    .eq('id', findingId)
    .maybeSingle()
  if (!findingRow || (findingRow.reports as { user_id: string }).user_id !== user.id) return

  const f = camel<Finding>(findingRow as Record<string, unknown>)

  const { error } = await adminDb().from('finding_templates').insert({
    user_id:        user.id,
    title:          f.title,
    description:    f.description,
    cvss_score:     f.cvssScore,
    severity:       f.severity,
    impact:         f.impact,
    recommendation: f.recommendation,
    evidence:       f.evidence,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/templates')
}

export async function deleteTemplate(templateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await adminDb()
    .from('finding_templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/templates')
}
