'use client'

import { History } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'
import { apiFetch } from '@/lib/admin-fetch'

type Revision = { id: string; title: string; createdAt: string; authorName: string | null }

export function RevisionsPanel({ postId, onRestored }: { postId: string; onRestored: () => void }) {
  const toast = useToast()
  const confirm = useConfirm()
  const [revisions, setRevisions] = useState<Revision[] | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    apiFetch<Revision[]>(`/api/admin/posts/${postId}/revisions`)
      .then(setRevisions)
      .catch(() => setRevisions([]))
  }, [postId])

  if (!revisions || revisions.length === 0) return null

  async function restore(revision: Revision) {
    const ok = await confirm({
      title: 'Restore this revision?',
      description: `The title and content from ${new Date(revision.createdAt).toLocaleString()} replace the current version. The current version is kept as a revision.`,
      confirmLabel: 'Restore',
    })
    if (!ok) return
    const restored = await toast.run(
      () => apiFetch(`/api/admin/posts/${postId}/revisions/${revision.id}`, { method: 'POST' }),
      'Revision restored.'
    )
    if (restored) onRestored()
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-semibold"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <History className="size-4 text-muted-foreground" />
          Revisions ({revisions.length})
        </span>
        <span className="text-xs font-normal text-primary">{open ? 'Hide' : 'Browse'}</span>
      </button>
      {open && (
        <ol className="max-h-72 space-y-2 overflow-y-auto">
          {revisions.map((revision) => (
            <li
              key={revision.id}
              className="flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-xs"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{revision.title}</p>
                <p className="text-muted-foreground">
                  {new Date(revision.createdAt).toLocaleString()}
                  {revision.authorName && ` · ${revision.authorName}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => restore(revision)}
                className="shrink-0 font-medium text-primary hover:underline"
              >
                Restore
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
