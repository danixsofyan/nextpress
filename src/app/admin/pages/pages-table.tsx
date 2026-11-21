'use client'

import { Badge } from '@/components/ui/badge'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
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

export function PagesTable({ initialRows }: { initialRows?: PageRow[] }) {
  const [rows, setRows] = useState<PageRow[] | null>(initialRows ?? null)
  const toast = useToast()
  const confirm = useConfirm()

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/pages')
    setRows(res.ok ? await res.json() : [])
  }, [])

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

  async function remove(items: PageRow[]) {
    try {
      await Promise.all(
        items.map((p) => apiFetch(`/api/admin/pages/${p.id}`, { method: 'DELETE' }))
      )
    } finally {
      await load()
    }
  }

  const bulkActions: BulkAction<PageRow>[] = [
    { label: 'Publish', run: (items) => setStatus(items, 'published') },
    { label: 'Move to Draft', run: (items) => setStatus(items, 'draft') },
    {
      label: 'Delete permanently',
      run: remove,
      confirm: (n) => `Delete ${n} page${n === 1 ? '' : 's'} permanently? This cannot be undone.`,
    },
  ]

  return (
    <DataTable
      rows={rows}
      rowId={(p) => p.id}
      columns={columns}
      searchText={(p) => `${p.title} ${p.slug}`}
      searchPlaceholder="Search pages"
      filters={filters}
      bulkActions={bulkActions}
      defaultSort={{ key: 'updated', dir: 'desc' }}
      emptyMessage="No pages yet."
      rowActions={(p) => (
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
              if (await confirm(`Delete "${p.title}" permanently? This cannot be undone.`)) {
                toast.run(() => remove([p]), 'Page deleted.')
              }
            }}
            className="rounded-md p-2 text-destructive hover:bg-destructive/10"
            aria-label={`Delete ${p.title}`}
          >
            <Trash2 className="size-4" />
          </button>
        </>
      )}
    />
  )
}
