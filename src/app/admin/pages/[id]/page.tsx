'use client'

import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { TiptapEditor } from '@/components/admin/editor/tiptap-editor'
import { RevisionsPanel } from '@/components/admin/editor/revisions-panel'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'
import { apiFetch, errorMessage } from '@/lib/admin-fetch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronRight, Trash2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const panelSummary =
  'flex cursor-pointer list-none items-center gap-2 px-4 py-3 select-none [&::-webkit-details-marker]:hidden'

export default function EditPagePage() {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const { id } = useParams<{ id: string }>()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [blocksJson, setBlocksJson] = useState('')
  const [contentOpen, setContentOpen] = useState(true)
  const [blocksOpen, setBlocksOpen] = useState(true)
  const [status, setStatus] = useState('draft')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin/pages/${id}`)
      .then((r) => r.json())
      .then((p) => {
        setTitle(p.title ?? '')
        setSlug(p.slug ?? '')
        setContent(p.content ?? '')
        setBlocksJson(p.blocks?.length ? JSON.stringify(p.blocks, null, 2) : '')
        setContentOpen(!p.blocks?.length)
        setBlocksOpen(Boolean(p.blocks?.length))
        setStatus(p.status ?? 'draft')
        setMetaTitle(p.metaTitle ?? '')
        setMetaDescription(p.metaDescription ?? '')
        setLoading(false)
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let blocks: unknown = null
    if (blocksJson.trim()) {
      try {
        blocks = JSON.parse(blocksJson)
      } catch {
        toast.error('Blocks must be valid JSON')
        return
      }
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          content,
          blocks,
          status,
          metaTitle: metaTitle || undefined,
          metaDescription: metaDescription || undefined,
        }),
      })
      if (!res.ok) {
        const message = (await res.json()).error ?? 'Failed'
        setError(message)
        toast.error(message)
        return
      }
      toast.success(status === 'published' ? 'Page published.' : 'Page saved.')
      router.push('/admin/pages')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!(await confirm('Delete this page?'))) return
    try {
      await apiFetch(`/api/admin/pages/${id}`, { method: 'DELETE' })
    } catch (error) {
      toast.error(errorMessage(error))
      return
    }
    toast.success('Page deleted.')
    router.push('/admin/pages')
  }

  if (loading)
    return (
      <DashboardLayout>
        <div className="p-8 text-muted-foreground">Loading...</div>
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Page</h1>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="mr-2 size-4" /> Delete
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 text-lg"
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="[a-z0-9-]+"
              className="mt-1 font-mono text-sm"
            />
          </div>
          <details
            open={contentOpen}
            onToggle={(e) => setContentOpen(e.currentTarget.open)}
            className="group rounded-xl border border-border"
          >
            <summary className={panelSummary}>
              <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
              <span className="text-sm font-semibold">Content</span>
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {blocksJson.trim() ? 'Hidden on the public page while blocks exist' : 'Rich text'}
              </span>
            </summary>
            <div className="border-t border-border p-4">
              <TiptapEditor content={content} onChange={setContent} />
            </div>
          </details>
          <details
            open={blocksOpen}
            onToggle={(e) => setBlocksOpen(e.currentTarget.open)}
            className="group rounded-xl border border-border"
          >
            <summary className={panelSummary}>
              <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
              <span className="text-sm font-semibold">Blocks</span>
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {blocksJson.trim() ? 'Replace the content on the public page' : 'Optional'}
              </span>
            </summary>
            <div className="space-y-2 border-t border-border p-4">
              <p className="text-xs text-muted-foreground">
                Landing-page sections (hero, features, steps, stats, code, table, FAQ, CTA, latest
                posts, rich text) as JSON. AI agents build these through the MCP tools{' '}
                <code>get_block_spec</code> and <code>update_page</code>.
              </p>
              <textarea
                value={blocksJson}
                onChange={(e) => setBlocksJson(e.target.value)}
                rows={blocksJson.trim() ? 16 : 3}
                spellCheck={false}
                aria-label="Page blocks JSON"
                placeholder='[{ "type": "hero", "heading": "Hello" }]'
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
            </div>
          </details>
        </div>
        <div className="space-y-4">
          <div className="space-y-4 rounded-xl border border-border bg-card p-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Update Page'}
            </Button>
          </div>
          <div className="space-y-4 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">SEO</h3>
            <div>
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                maxLength={60}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="metaDescription">Meta Description</Label>
              <textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                maxLength={160}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
            </div>
          </div>
          <RevisionsPanel
            basePath={`/api/admin/pages/${id}`}
            onRestored={() => window.location.reload()}
          />
        </div>
      </form>
    </DashboardLayout>
  )
}
