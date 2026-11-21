'use client'

import { useEffect, useState } from 'react'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'
import { apiFetch } from '@/lib/admin-fetch'
import { type Column, DataTable } from '@/components/admin/data-table'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { Tabs } from '@/components/admin/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus } from 'lucide-react'

type Taxonomy = { id: string; name: string; slug: string; type: string; description: string | null }

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const columns: Column<Taxonomy>[] = [
  {
    key: 'name',
    header: 'Name',
    sortValue: (t) => t.name.toLowerCase(),
    cell: (t) => <span className="font-medium">{t.name}</span>,
  },
  {
    key: 'slug',
    header: 'Slug',
    sortValue: (t) => t.slug,
    cell: (t) => <span className="text-muted-foreground">{t.slug}</span>,
  },
  {
    key: 'description',
    header: 'Description',
    cell: (t) => <span className="text-muted-foreground">{t.description || '—'}</span>,
  },
]

function TaxTab({ type }: { type: 'category' | 'tag' }) {
  const [items, setItems] = useState<Taxonomy[]>([])
  const toast = useToast()
  const confirm = useConfirm()
  const [loaded, setLoaded] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin/taxonomies?type=${type}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(Array.isArray(d) ? d : [])
        setLoaded(true)
      })
  }, [type])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/taxonomies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, type, description: description || undefined }),
      })
      if (!res.ok) {
        const message = (await res.json()).error ?? 'Failed'
        setError(message)
        toast.error(message)
        return
      }
      const item = await res.json()
      toast.success(`${type === 'category' ? 'Category' : 'Tag'} "${item.name}" added.`)
      setItems((prev) => [item, ...prev])
      setName('')
      setSlug('')
      setDescription('')
      setSlugEdited(false)
    } finally {
      setSaving(false)
    }
  }

  async function remove(rows: Taxonomy[]) {
    await Promise.all(
      rows.map((r) => apiFetch(`/api/admin/taxonomies/${r.id}`, { method: 'DELETE' }))
    )
    const ids = new Set(rows.map((r) => r.id))
    setItems((prev) => prev.filter((i) => !ids.has(i.id)))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <DataTable
        key={type}
        rows={loaded ? items : null}
        rowId={(item) => item.id}
        columns={columns}
        searchText={(item) => `${item.name} ${item.slug} ${item.description ?? ''}`}
        searchPlaceholder={`Search ${type === 'category' ? 'categories' : 'tags'}`}
        bulkActions={[
          {
            label: 'Delete',
            run: remove,
            confirm: (n) => `Delete ${n} selected item${n === 1 ? '' : 's'}?`,
          },
        ]}
        defaultSort={{ key: 'name', dir: 'asc' }}
        emptyMessage={`No ${type === 'category' ? 'categories' : 'tags'} yet.`}
        rowActions={(item) => (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Delete ${item.name}`}
            onClick={async () => {
              if (await confirm(`Delete "${item.name}"?`))
                toast.run(() => remove([item]), 'Deleted.')
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      />

      <form
        onSubmit={handleAdd}
        className="h-fit space-y-4 rounded-xl border border-border bg-card p-4"
      >
        <h3 className="text-sm font-semibold">
          Add New {type === 'category' ? 'Category' : 'Tag'}
        </h3>
        <div>
          <Label htmlFor={`${type}-name`}>Name</Label>
          <Input
            id={`${type}-name`}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!slugEdited) setSlug(toSlug(e.target.value))
            }}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor={`${type}-slug`}>Slug</Label>
          <Input
            id={`${type}-slug`}
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugEdited(true)
            }}
            required
            pattern="[a-z0-9-]+"
            className="mt-1 font-mono text-sm"
          />
        </div>
        <div>
          <Label htmlFor={`${type}-desc`}>Description</Label>
          <textarea
            id={`${type}-desc`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={saving} className="w-full">
          <Plus className="mr-2 size-4" />{' '}
          {saving ? 'Adding...' : `Add ${type === 'category' ? 'Category' : 'Tag'}`}
        </Button>
      </form>
    </div>
  )
}

export default function TaxonomiesPage() {
  const [tab, setTab] = useState<'category' | 'tag'>('category')

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">Taxonomies</h1>
      <Tabs
        tabs={[
          { key: 'category', label: 'Categories' },
          { key: 'tag', label: 'Tags' },
        ]}
        value={tab}
        onChange={setTab}
        label="Taxonomy type"
      />
      <TaxTab key={tab} type={tab} />
    </DashboardLayout>
  )
}
