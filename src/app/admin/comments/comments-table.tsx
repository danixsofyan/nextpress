'use client'

import { Badge } from '@/components/ui/badge'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'
import {
  type BulkAction,
  type Column,
  DataTable,
  type FilterOption,
} from '@/components/admin/data-table'
import { apiFetch } from '@/lib/admin-fetch'
import { useCallback, useState } from 'react'

type Status = 'pending' | 'approved' | 'spam' | 'trash'

type CommentRow = {
  id: string
  authorName: string
  content: string
  status: Status
  createdAt: string
  parentId: string | null
  postId: string
  postTitle: string
  postSlug: string
}

const STATUS_LABEL: Record<Status, string> = {
  pending: 'Pending',
  approved: 'Approved',
  spam: 'Spam',
  trash: 'Trash',
}

const columns: Column<CommentRow>[] = [
  {
    key: 'author',
    header: 'Author',
    sortValue: (c) => c.authorName.toLowerCase(),
    cell: (c) => <span className="font-medium">{c.authorName}</span>,
  },
  {
    key: 'comment',
    header: 'Comment',
    cell: (c) => (
      <p className="line-clamp-3 max-w-xl whitespace-pre-line text-muted-foreground">
        {c.parentId && <span className="text-xs text-foreground">↳ Reply · </span>}
        {c.content}
      </p>
    ),
  },
  {
    key: 'post',
    header: 'In response to',
    sortValue: (c) => c.postTitle.toLowerCase(),
    cell: (c) => (
      <a
        href={`/blog/${c.postSlug}#comments`}
        target="_blank"
        rel="noreferrer"
        className="hover:underline"
      >
        {c.postTitle}
      </a>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortValue: (c) => c.status,
    cell: (c) => (
      <Badge
        variant={
          c.status === 'approved' ? 'default' : c.status === 'pending' ? 'outline' : 'secondary'
        }
      >
        {STATUS_LABEL[c.status]}
      </Badge>
    ),
  },
  {
    key: 'date',
    header: 'Submitted',
    sortValue: (c) => c.createdAt,
    cell: (c) => (
      <span className="text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
    ),
  },
]

const filters: FilterOption<CommentRow>[] = (Object.keys(STATUS_LABEL) as Status[]).map((s) => ({
  value: s,
  label: STATUS_LABEL[s],
  match: (c) => c.status === s,
}))

export function CommentsTable({ initialRows }: { initialRows: CommentRow[] }) {
  const [rows, setRows] = useState<CommentRow[]>(initialRows)
  const toast = useToast()
  const confirm = useConfirm()

  const load = useCallback(async () => {
    setRows(await apiFetch<CommentRow[]>('/api/admin/comments'))
  }, [])

  async function each(items: CommentRow[], request: (c: CommentRow) => Promise<unknown>) {
    try {
      await Promise.all(items.map(request))
    } finally {
      await load()
    }
  }

  const setStatus = (items: CommentRow[], status: Status) =>
    each(items, (c) =>
      apiFetch(`/api/admin/comments/${c.id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    )
  const remove = (items: CommentRow[]) =>
    each(
      items.filter((c) => c.status === 'spam' || c.status === 'trash'),
      (c) => apiFetch(`/api/admin/comments/${c.id}`, { method: 'DELETE' })
    )

  const bulkActions: BulkAction<CommentRow>[] = [
    { label: 'Approve', run: (items) => setStatus(items, 'approved') },
    { label: 'Unapprove', run: (items) => setStatus(items, 'pending') },
    { label: 'Mark as spam', run: (items) => setStatus(items, 'spam') },
    { label: 'Move to Trash', run: (items) => setStatus(items, 'trash') },
    {
      label: 'Delete permanently',
      run: remove,
      confirm: (n) =>
        `Delete ${n} comment${n === 1 ? '' : 's'} permanently? Only spam and trashed comments are deleted.`,
    },
  ]

  const action = 'rounded-md px-2 py-1 text-xs font-medium hover:bg-muted'

  return (
    <DataTable
      rows={rows}
      rowId={(c) => c.id}
      columns={columns}
      searchText={(c) => `${c.authorName} ${c.content} ${c.postTitle}`}
      searchPlaceholder="Search comments"
      filters={filters}
      bulkActions={bulkActions}
      defaultSort={{ key: 'date', dir: 'desc' }}
      emptyMessage="No comments yet."
      rowActions={(c) => (
        <div className="flex flex-wrap justify-end gap-1">
          {c.status !== 'approved' && (
            <button
              type="button"
              className={`${action} text-primary`}
              onClick={() => toast.run(() => setStatus([c], 'approved'), 'Comment approved.')}
            >
              Approve
            </button>
          )}
          {c.status === 'approved' && (
            <button
              type="button"
              className={action}
              onClick={() => toast.run(() => setStatus([c], 'pending'), 'Comment unapproved.')}
            >
              Unapprove
            </button>
          )}
          {c.status !== 'spam' && (
            <button
              type="button"
              className={action}
              onClick={() => toast.run(() => setStatus([c], 'spam'), 'Marked as spam.')}
            >
              Spam
            </button>
          )}
          {c.status !== 'trash' && c.status !== 'spam' ? (
            <button
              type="button"
              className={`${action} text-destructive`}
              onClick={() =>
                toast.run(() => setStatus([c], 'trash'), 'Comment moved to the Trash.')
              }
            >
              Trash
            </button>
          ) : (
            <button
              type="button"
              className={`${action} text-destructive`}
              onClick={async () => {
                if (
                  await confirm({
                    title: 'Delete this comment permanently?',
                    description: 'This cannot be undone.',
                    confirmLabel: 'Delete',
                    destructive: true,
                  })
                ) {
                  toast.run(() => remove([c]), 'Comment deleted permanently.')
                }
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    />
  )
}
