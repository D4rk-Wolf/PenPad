'use client'

import { useState } from 'react'
import { deleteTemplate } from '@/app/actions/templates'
import { Icons } from '@/components/penpad/icons'
import { SeverityPill } from '@/components/penpad/ui'
import type { FindingTemplate } from '@/lib/db/schema'
import type { Severity } from '@/lib/utils'

export function TemplateList({ templates }: { templates: FindingTemplate[] }) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? templates.filter(t => t.title.toLowerCase().includes(query.toLowerCase()))
    : templates

  return (
    <div className="tpl-table-wrap">
      <div className="tpl-toolbar">
        <div className="tpl-search">
          <Icons.Search size={14} />
          <input
            placeholder="Search templates…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><Icons.Stack size={22} /></div>
          <p className="empty-title">No templates yet</p>
          <p className="empty-subtitle">On any finding, click &quot;Save as template&quot; to build your library.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><Icons.Search size={22} /></div>
          <p className="empty-title">No results</p>
          <p className="empty-subtitle">No templates match &quot;{query}&quot;.</p>
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Title</th>
              <th>Severity</th>
              <th>Category</th>
              <th>CVSS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => {
              const severity = (t.severity ?? 'info') as Severity
              const cvss = Number(t.cvssScore ?? 0)
              return (
                <tr key={t.id} className="tbl-row">
                  <td style={{ fontWeight: 500 }}>{t.title}</td>
                  <td><SeverityPill severity={severity as 'critical' | 'high' | 'medium' | 'low' | 'info'} /></td>
                  <td style={{ color: 'var(--fg-muted)', fontSize: 'var(--fs-sm)' }}>—</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)', color: cvss > 0 ? 'var(--fg)' : 'var(--fg-muted)' }}>
                    {cvss > 0 ? cvss.toFixed(1) : '—'}
                  </td>
                  <td>
                    <form action={deleteTemplate.bind(null, t.id)} style={{ display: 'contents' }}>
                      <button type="submit" className="btn btn-ghost btn-icon" aria-label="Delete template">
                        <Icons.Trash size={13} style={{ color: 'var(--fg-muted)' }} />
                      </button>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
