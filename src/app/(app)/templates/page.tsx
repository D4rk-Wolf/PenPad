import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyTemplates, deleteTemplate } from '@/app/actions/templates'
import { getSubscription } from '@/app/actions/reports'
import { Button } from '@/components/ui/button'
import { SEVERITY_COLOURS } from '@/lib/utils'
import type { Severity } from '@/lib/utils'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const sub = await getSubscription(user.id)
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
