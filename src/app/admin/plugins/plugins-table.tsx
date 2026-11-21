'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/admin/toast'
import { apiFetch } from '@/lib/admin-fetch'
import type { PluginField } from '@/plugins'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type PluginRow = {
  id: string
  name: string
  description: string
  category: string
  version: string
  fields: PluginField[]
  config: Record<string, string>
  active: boolean
  configured: boolean
  missingEnv: string[]
}

type View = 'all' | 'active' | 'inactive'

export function PluginsTable({ rows }: { rows: PluginRow[] }) {
  const router = useRouter()
  const toast = useToast()
  const [view, setView] = useState<View>('all')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  const counts = {
    all: rows.length,
    active: rows.filter((r) => r.active).length,
    inactive: rows.filter((r) => !r.active).length,
  }
  const shown = rows.filter((r) => view === 'all' || (view === 'active') === r.active)

  async function save(
    row: PluginRow,
    body: { active?: boolean; config?: Record<string, string> },
    message: string
  ) {
    setBusy(row.id)
    const ok = await toast.run(
      () => apiFetch(`/api/admin/plugins/${row.id}`, { method: 'PUT', body: JSON.stringify(body) }),
      message
    )
    setBusy(null)
    if (ok) {
      if (body.config) setEditing(null)
      router.refresh()
    }
  }

  function openSettings(row: PluginRow) {
    setDraft(Object.fromEntries(row.fields.map((f) => [f.key, row.config[f.key] ?? ''])))
    setEditing(editing === row.id ? null : row.id)
  }

  return (
    <div className="space-y-4">
      <nav className="flex gap-2 text-sm text-muted-foreground" aria-label="Plugin views">
        {(['all', 'active', 'inactive'] as const).map((v, i) => (
          <span key={v} className="flex gap-2">
            {i > 0 && '|'}
            <button
              type="button"
              onClick={() => setView(v)}
              className={
                view === v ? 'font-semibold text-foreground' : 'text-primary hover:underline'
              }
            >
              {v[0]!.toUpperCase() + v.slice(1)} ({counts[v]})
            </button>
          </span>
        ))}
      </nav>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="w-1/3 px-4 py-3 font-medium">Plugin</th>
              <th className="px-4 py-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <PluginRowView
                key={row.id}
                row={row}
                busy={busy === row.id}
                editing={editing === row.id}
                draft={draft}
                setDraft={setDraft}
                onToggle={() =>
                  save(
                    row,
                    { active: !row.active },
                    `${row.name} ${row.active ? 'deactivated' : 'activated'}.`
                  )
                }
                onSettings={() => openSettings(row)}
                onSave={() => save(row, { config: draft }, `${row.name} settings saved.`)}
              />
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                  No plugins in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PluginRowView({
  row,
  busy,
  editing,
  draft,
  setDraft,
  onToggle,
  onSettings,
  onSave,
}: {
  row: PluginRow
  busy: boolean
  editing: boolean
  draft: Record<string, string>
  setDraft: (d: Record<string, string>) => void
  onToggle: () => void
  onSettings: () => void
  onSave: () => void
}) {
  const blocked = !row.active && (!row.configured || row.missingEnv.length > 0)
  return (
    <>
      <tr className={`border-t align-top ${row.active ? 'bg-primary/5' : ''}`}>
        <td
          className={`px-4 py-3 ${row.active ? 'border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
        >
          <p className="font-semibold">{row.name}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <button
              type="button"
              disabled={busy || blocked}
              onClick={onToggle}
              title={blocked ? 'Fill in the settings first' : undefined}
              className={`font-medium hover:underline disabled:no-underline disabled:opacity-50 ${row.active ? 'text-destructive' : 'text-primary'}`}
            >
              {row.active ? 'Deactivate' : 'Activate'}
            </button>
            {row.fields.length > 0 && (
              <button
                type="button"
                onClick={onSettings}
                className="font-medium text-primary hover:underline"
              >
                Settings
              </button>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <p>{row.description}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            Version {row.version}
            <Badge variant="secondary">{row.category}</Badge>
            {!row.configured && <Badge variant="outline">Needs settings</Badge>}
            {row.missingEnv.length > 0 && (
              <Badge variant="outline">Needs env: {row.missingEnv.join(', ')}</Badge>
            )}
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="border-t bg-muted/30">
          <td colSpan={2} className="px-4 py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onSave()
              }}
              className="grid max-w-xl gap-4"
            >
              {row.fields.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={`${row.id}-${field.key}`}>{field.label}</Label>
                  <Input
                    id={`${row.id}-${field.key}`}
                    value={draft[field.key] ?? ''}
                    placeholder={field.placeholder}
                    onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value.trim() })}
                    className="mt-1"
                  />
                  {field.help && <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>}
                </div>
              ))}
              <div className="flex gap-2">
                <Button type="submit" disabled={busy}>
                  Save settings
                </Button>
                <Button type="button" variant="outline" onClick={onSettings}>
                  Cancel
                </Button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  )
}
