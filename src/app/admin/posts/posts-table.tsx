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

type PostRow = {
  id: string
  title: string
  slug: string
  authorName: string | null
  status: 'draft' | 'published'
  createdAt: string
  publishedAt: string | null
  visibility?: 'public' | 'private'
  isSticky?: boolean
}

const formatDate = (value: string) => new Date(value).toLocaleDateString()

const isScheduled = (p: PostRow) =>
  p.status === 'published' &&
  p.publishedAt !== null &&
  new Date(p.publishedAt).getTime() > Date.now()

const statusLabel = (p: PostRow) => (isScheduled(p) ? 'scheduled' : p.status)

const columns: Column<PostRow>[] = [
  {
    key: 'title',
    header: 'Title',
    sortValue: (p) => p.title.toLowerCase(),
    cell: (p) => (
      <Link href={`/admin/posts/${p.id}`} className="font-medium hover:underline">
        {p.title}
        {[
          p.status === 'draft' && 'Draft',
          isScheduled(p) && 'Scheduled',
          p.visibility === 'private' && 'Private',
          p.isSticky && 'Sticky',
        ]
          .filter(Boolean)
          .map((label) => (
            <span key={label as string} className="text-muted-foreground">
              {' '}
              — {label}
            </span>
          ))}
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
    sortValue: statusLabel,
    cell: (p) => (
      <Badge variant={statusLabel(p) === 'published' ? 'default' : 'secondary'}>
        {statusLabel(p)}
      </Badge>
    ),
  },
  {
    key: 'date',
    header: 'Date',
    sortValue: (p) => p.publishedAt ?? p.createdAt,
    cell: (p) => (
      <span className="text-muted-foreground">
        {isScheduled(p) ? 'Scheduled' : p.status === 'published' ? 'Published' : 'Last modified'}
        <br />
        {formatDate(p.publishedAt ?? p.createdAt)}
      </span>
    ),
  },
]

const filters: FilterOption<PostRow>[] = [
  {
    value: 'published',
    label: 'Published',
    match: (p) => p.status === 'published' && !isScheduled(p),
  },
  { value: 'draft', label: 'Drafts', match: (p) => p.status === 'draft' },
  { value: 'scheduled', label: 'Scheduled', match: isScheduled },
  { value: 'private', label: 'Private', match: (p) => p.visibility === 'private' },
]

export function PostsTable({
  initialRows,
  view = 'all',
}: {
  initialRows?: PostRow[]
  view?: 'all' | 'trash'
}) {
  const [rows, setRows] = useState<PostRow[] | null>(initialRows ?? null)
  const toast = useToast()
  const confirm = useConfirm()
  const router = useRouter()

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/posts${view === 'trash' ? '?trashed=1' : ''}`)
    setRows(res.ok ? await res.json() : [])
  }, [view])

  useEffect(() => {
    if (!initialRows) load()
  }, [load, initialRows])

  async function setStatus(items: PostRow[], status: PostRow['status']) {
    try {
      await Promise.all(
        items.map((p) =>
          apiFetch(`/api/admin/posts/${p.id}`, {
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

  async function each(items: PostRow[], request: (p: PostRow) => Promise<unknown>) {
    try {
      await Promise.all(items.map(request))
    } finally {
      await load()
      router.refresh()
    }
  }

  const trash = (items: PostRow[]) =>
    each(items, (p) => apiFetch(`/api/admin/posts/${p.id}`, { method: 'DELETE' }))
  const restore = (items: PostRow[]) =>
    each(items, (p) => apiFetch(`/api/admin/posts/${p.id}/restore`, { method: 'POST' }))
  const purge = (items: PostRow[]) =>
    each(items, (p) => apiFetch(`/api/admin/posts/${p.id}?permanent=1`, { method: 'DELETE' }))

  const shownColumns: Column<PostRow>[] =
    view === 'trash'
      ? columns.map((c) =>
          c.key === 'title'
            ? { ...c, cell: (p) => <span className="font-medium">{p.title}</span> }
            : c
        )
      : columns

  const bulkActions: BulkAction<PostRow>[] =
    view === 'trash'
      ? [
          { label: 'Restore', run: restore },
          {
            label: 'Delete permanently',
            run: purge,
            confirm: (n) =>
              `Delete ${n} post${n === 1 ? '' : 's'} permanently? This cannot be undone.`,
          },
        ]
      : [
          { label: 'Publish', run: (items) => setStatus(items, 'published') },
          { label: 'Move to Draft', run: (items) => setStatus(items, 'draft') },
          {
            label: 'Move to Trash',
            run: trash,
            confirm: (n) => `Move ${n} post${n === 1 ? '' : 's'} to the Trash?`,
          },
        ]

  return (
    <DataTable
      rows={rows}
      rowId={(p) => p.id}
      columns={shownColumns}
      searchText={(p) => `${p.title} ${p.slug}`}
      searchPlaceholder="Search posts"
      {...(view === 'all' && { filters })}
      bulkActions={bulkActions}
      defaultSort={{ key: 'date', dir: 'desc' }}
      emptyMessage={view === 'trash' ? 'The Trash is empty.' : 'No posts yet.'}
      rowActions={(p) =>
        view === 'trash' ? (
          <>
            <button
              type="button"
              onClick={() => toast.run(() => restore([p]), 'Post restored.')}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Restore ${p.title}`}
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              type="button"
              onClick={async () => {
                if (await confirm(`Delete "${p.title}" permanently? This cannot be undone.`)) {
                  toast.run(() => purge([p]), 'Post deleted permanently.')
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
              href={`/admin/posts/${p.id}`}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Edit ${p.title}`}
            >
              <Pencil className="size-4" />
            </Link>
            {p.status === 'published' && (
              <a
                href={`/blog/${p.slug}`}
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
                if (ok) toast.run(() => trash([p]), 'Post moved to the Trash.')
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
