'use client'

import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'
import {
  type BulkAction,
  type Column,
  DataTable,
  type FilterOption,
} from '@/components/admin/data-table'
import { isRole, ROLE_LABELS, ROLES, type Role } from '@/lib/roles'

type UserRow = { id: string; name: string; email: string; role: string; createdAt: string }

const roleLabel = (role: string) => (isRole(role) ? ROLE_LABELS[role] : role)

const columns: Column<UserRow>[] = [
  {
    key: 'name',
    header: 'Name',
    sortValue: (u) => u.name.toLowerCase(),
    cell: (u) => (
      <Link
        href={`/admin/users/${u.id}`}
        className="flex items-center gap-3 font-medium hover:underline"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {u.name.charAt(0).toUpperCase()}
        </span>
        {u.name}
      </Link>
    ),
  },
  {
    key: 'email',
    header: 'Email',
    sortValue: (u) => u.email,
    cell: (u) => <span className="text-muted-foreground">{u.email}</span>,
  },
  {
    key: 'role',
    header: 'Role',
    sortValue: (u) => u.role,
    cell: (u) => (
      <Badge variant={u.role === 'administrator' ? 'default' : 'secondary'}>
        {roleLabel(u.role)}
      </Badge>
    ),
  },
  {
    key: 'created',
    header: 'Registered',
    sortValue: (u) => u.createdAt,
    cell: (u) => (
      <span className="text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
    ),
  },
]

const filters: FilterOption<UserRow>[] = ROLES.map((role: Role) => ({
  value: role,
  label: ROLE_LABELS[role],
  match: (u: UserRow) => u.role === role,
}))

export function UsersTable({
  currentUserId,
  initialRows,
}: {
  currentUserId: string
  initialRows?: UserRow[]
}) {
  const [rows, setRows] = useState<UserRow[] | null>(initialRows ?? null)
  const toast = useToast()
  const confirm = useConfirm()

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/users')
    setRows(res.ok ? await res.json() : [])
  }, [])

  useEffect(() => {
    if (!initialRows) load()
  }, [load, initialRows])

  async function remove(items: UserRow[]) {
    const results = await Promise.all(
      items.map(async (u) => {
        const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' })
        return res.ok
          ? null
          : `${u.name}: ${(await res.json().catch(() => ({}))).error ?? 'failed'}`
      })
    )
    await load()
    const failed = results.filter(Boolean)
    if (failed.length) throw new Error(failed.join(' · '))
  }

  async function changeRole(items: UserRow[], role: Role) {
    const results = await Promise.all(
      items.map(async (u) => {
        const res = await fetch(`/api/admin/users/${u.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        })
        return res.ok
          ? null
          : `${u.name}: ${(await res.json().catch(() => ({}))).error ?? 'failed'}`
      })
    )
    await load()
    const failed = results.filter(Boolean)
    if (failed.length) throw new Error(failed.join(' · '))
  }

  const bulkActions: BulkAction<UserRow>[] = [
    ...ROLES.map((role) => ({
      label: `Change role to ${ROLE_LABELS[role]}`,
      run: (items: UserRow[]) => changeRole(items, role),
    })),
    {
      label: 'Delete',
      run: remove,
      confirm: (n) => `Delete ${n} user${n === 1 ? '' : 's'} permanently? This cannot be undone.`,
    },
  ]

  return (
    <div className="space-y-3">
      <DataTable
        rows={rows}
        rowId={(u) => u.id}
        columns={columns}
        searchText={(u) => `${u.name} ${u.email}`}
        searchPlaceholder="Search users"
        filters={filters}
        bulkActions={bulkActions}
        defaultSort={{ key: 'name', dir: 'asc' }}
        emptyMessage="No users yet."
        rowActions={(u) => (
          <>
            <Link
              href={`/admin/users/${u.id}`}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Edit ${u.name}`}
            >
              <Pencil className="size-4" />
            </Link>
            {u.id !== currentUserId && (
              <button
                type="button"
                onClick={async () => {
                  if (await confirm(`Delete "${u.name}" permanently? This cannot be undone.`)) {
                    toast.run(() => remove([u]), `User "${u.name}" deleted.`)
                  }
                }}
                className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                aria-label={`Delete ${u.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </>
        )}
      />
    </div>
  )
}
