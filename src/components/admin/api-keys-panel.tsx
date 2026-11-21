'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Copy, KeyRound, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/admin-fetch'
import { useConfirm } from './confirm-dialog'
import { useToast } from './toast'
import { type Column, DataTable } from './data-table'

type ApiKey = {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt: string | null
}

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : 'Never'

const KEY_PAGE_SIZES = [5, 10, 25]

const columns: Column<ApiKey>[] = [
  {
    key: 'name',
    header: 'Name',
    sortValue: (k) => k.name.toLowerCase(),
    cell: (k) => <span className="font-medium">{k.name}</span>,
  },
  {
    key: 'prefix',
    header: 'Key',
    cell: (k) => <span className="font-mono text-xs text-muted-foreground">{k.prefix}…</span>,
  },
  {
    key: 'created',
    header: 'Created',
    sortValue: (k) => k.createdAt,
    cell: (k) => <span className="text-muted-foreground">{formatDate(k.createdAt)}</span>,
  },
  {
    key: 'lastUsed',
    header: 'Last used',
    sortValue: (k) => k.lastUsedAt ?? '',
    cell: (k) => <span className="text-muted-foreground">{formatDate(k.lastUsedAt)}</span>,
  },
]

export function ApiKeysPanel() {
  const [keys, setKeys] = useState<ApiKey[] | null>(null)
  const toast = useToast()
  const confirm = useConfirm()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<{ name: string; key: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/api-keys')
    setKeys(res.ok ? await res.json() : [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError('')
    const res = await fetch('/api/admin/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setCreating(false)
    if (!res.ok) {
      setError('Could not create the key')
      toast.error('Could not create the key')
      return
    }
    const created = await res.json()
    setNewKey({ name: created.name, key: created.key })
    toast.success(`Key "${created.name}" created. Copy it now.`)
    setCopied(false)
    setName('')
    load()
  }

  async function revoke(rows: ApiKey[]) {
    try {
      await Promise.all(
        rows.map((k) => apiFetch(`/api/admin/api-keys/${k.id}`, { method: 'DELETE' }))
      )
    } finally {
      await load()
    }
  }

  async function handleRevoke(key: ApiKey) {
    const ok = await confirm({
      title: `Revoke "${key.name}"?`,
      description: 'Apps using this key will stop working.',
      confirmLabel: 'Revoke',
      destructive: true,
    })
    if (ok) toast.run(() => revoke([key]), 'Key revoked.')
  }

  async function copyKey() {
    if (!newKey) return
    await navigator.clipboard.writeText(newKey.key)
    setCopied(true)
    toast.success('Key copied to clipboard.')
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div>
        <h3 className="text-sm font-semibold">API Keys</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Send a key in the <code className="font-mono">X-Api-Key</code> header to use the REST API
          and the MCP server.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor="api_key_name">Key name</Label>
          <Input
            id="api_key_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Claude Desktop"
            maxLength={100}
            required
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={creating}>
          <KeyRound className="mr-2 size-4" />
          {creating ? 'Generating...' : 'Generate key'}
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {newKey && (
        <div className="space-y-2 rounded-lg border border-border bg-muted p-3">
          <p className="text-sm font-medium">
            New key for “{newKey.name}”. Copy it now: it will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-background px-3 py-2 font-mono text-xs break-all">
              {newKey.key}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={copyKey}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              <span className="sr-only">Copy key</span>
            </Button>
          </div>
        </div>
      )}

      <DataTable
        rows={keys}
        rowId={(key) => key.id}
        columns={columns}
        searchText={(key) => `${key.name} ${key.prefix}`}
        searchPlaceholder="Search keys"
        bulkActions={[
          {
            label: 'Revoke',
            run: revoke,
            confirm: (n) =>
              `Revoke ${n} key${n === 1 ? '' : 's'}? Apps using them will stop working.`,
          },
        ]}
        defaultSort={{ key: 'created', dir: 'desc' }}
        emptyMessage="No API keys yet."
        pageSizes={KEY_PAGE_SIZES}
        rowActions={(key) => (
          <button
            type="button"
            onClick={() => handleRevoke(key)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            Revoke
          </button>
        )}
      />
    </div>
  )
}
