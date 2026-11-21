'use client'

import { Badge } from '@/components/ui/badge'
import { ExternalLink, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/admin-fetch'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'
import {
  type BulkAction,
  type Column,
  DataTable,
  type FilterOption,
} from '@/components/admin/data-table'

type PageRow = {
  id: string
  title: string
  slug: string
  authorName: string | null
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

const columns: Column<PageRow>[] = [
  {
    key: 'title',
    header: 'Title',
    sortValue: (p) => p.title.toLowerCase(),
    cell: (p) => (
      <Link href={`/admin/pages/${p.id}`} className="font-medium hover:underline">
        {p.title}
        {p.status === 'draft' && <span className="text-muted-foreground"> — Draft</span>}
      </Link>
    ),
  },
  {
    key: 'author',
    header: 'Author',
    sortValue: (p) => p.authorName ?? '',
    cell: (p) => <span className="text-muted-foreground">{p.authorName ?? '—'}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    sortValue: (p) => p.status,
    cell: (p) => (
      <Badge variant={p.status === 'published' ? 'default' : 'secondary'}>{p.status}</Badge>
    ),
  },
  {
    key: 'updated',
    header: 'Last modified',
    sortValue: (p) => p.updatedAt,
    cell: (p) => (
      <span className="text-muted-foreground">{new Date(p.updatedAt).toLocaleDateString()}</span>
    ),
  },
]

const filters: FilterOption<PageRow>[] = [
  { value: 'published', label: 'Published', match: (p) => p.status === 'published' },
  { value: 'draft', label: 'Drafts', match: (p) => p.status === 'draft' },
]

export function PagesTable({
  initialRows,
  view = 'all',
}: {
  initialRows?: PageRow[]
  view?: 'all' | 'trash'
}) {
  const [rows, setRows] = useState<PageRow[] | null>(initialRows ?? null)
  const toast = useToast()
  const confirm = useConfirm()
  const router = useRouter()

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/pages${view === 'trash' ? '?trashed=1' : ''}`)
    setRows(res.ok ? await res.json() : [])
  }, [view])

  useEffect(() => {
    if (!initialRows) load()
  }, [load, initialRows])

  async function setStatus(items: PageRow[], status: PageRow['status']) {
    try {
      await Promise.all(
        items.map((p) =>
          apiFetch(`/api/admin/pages/${p.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
        )
      )
    } finally {
      await load()
    }
  }

  async function each(items: PageRow[], request: (p: PageRow) => Promise<unknown>) {
    try {
      await Promise.all(items.map(request))
    } finally {
      await load()
      router.refresh()
    }
  }

  const trash = (items: PageRow[]) =>
    each(items, (p) => apiFetch(`/api/admin/pages/${p.id}`, { method: 'DELETE' }))
  const restore = (items: PageRow[]) =>
    each(items, (p) => apiFetch(`/api/admin/pages/${p.id}/restore`, { method: 'POST' }))
  const purge = (items: PageRow[]) =>
    each(items, (p) => apiFetch(`/api/admin/pages/${p.id}?permanent=1`, { method: 'DELETE' }))

  const shownColumns: Column<PageRow>[] =
    view === 'trash'
      ? columns.map((c) =>
          c.key === 'title'
            ? { ...c, cell: (p) => <span className="font-medium">{p.title}</span> }
            : c
        )
      : columns

  const bulkActions: BulkAction<PageRow>[] =
    view === 'trash'
      ? [
          { label: 'Restore', run: restore },
          {
            label: 'Delete permanently',
            run: purge,
            confirm: (n) =>
              `Delete ${n} page${n === 1 ? '' : 's'} permanently? This cannot be undone.`,
          },
        ]
      : [
          { label: 'Publish', run: (items) => setStatus(items, 'published') },
          { label: 'Move to Draft', run: (items) => setStatus(items, 'draft') },
          {
            label: 'Move to Trash',
            run: trash,
            confirm: (n) => `Move ${n} page${n === 1 ? '' : 's'} to the Trash?`,
          },
        ]

  return (
    <DataTable
      rows={rows}
      rowId={(p) => p.id}
      columns={shownColumns}
      searchText={(p) => `${p.title} ${p.slug}`}
      searchPlaceholder="Search pages"
      {...(view === 'all' && { filters })}
      bulkActions={bulkActions}
      defaultSort={{ key: 'updated', dir: 'desc' }}
      emptyMessage={view === 'trash' ? 'The Trash is empty.' : 'No pages yet.'}
      rowActions={(p) =>
        view === 'trash' ? (
          <>
            <button
              type="button"
              onClick={() => toast.run(() => restore([p]), 'Page restored.')}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Restore ${p.title}`}
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              type="button"
              onClick={async () => {
                if (await confirm(`Delete "${p.title}" permanently? This cannot be undone.`)) {
                  toast.run(() => purge([p]), 'Page deleted permanently.')
                }
              }}
              className="rounded-md p-2 text-destructive hover:bg-destructive/10"
              aria-label={`Delete ${p.title} permanently`}
            >
              <Trash2 className="size-4" />
            </button>
          </>
        ) : (
          <>
            <Link
              href={`/admin/pages/${p.id}`}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Edit ${p.title}`}
            >
              <Pencil className="size-4" />
            </Link>
            {p.status === 'published' && (
              <a
                href={`/${p.slug}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`View ${p.title}`}
              >
                <ExternalLink className="size-4" />
              </a>
            )}
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({
                  title: `Move "${p.title}" to the Trash?`,
                  description: 'You can restore it from the Trash.',
                  confirmLabel: 'Move to Trash',
                  destructive: true,
                })
                if (ok) toast.run(() => trash([p]), 'Page moved to the Trash.')
              }}
              className="rounded-md p-2 text-destructive hover:bg-destructive/10"
              aria-label={`Move ${p.title} to the Trash`}
            >
              <Trash2 className="size-4" />
            </button>
          </>
        )
      }
    />
  )
}
