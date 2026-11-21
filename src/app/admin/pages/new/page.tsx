'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/admin/toast'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TiptapEditor } from '@/components/admin/editor/tiptap-editor'

function toSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function NewPagePage() {
  const router = useRouter()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('draft')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          content,
          status,
          metaTitle: metaTitle || undefined,
          metaDescription: metaDescription || undefined,
        }),
      })
      if (!res.ok) {
        const message = (await res.json()).error ?? 'Failed to save'
        setError(message)
        toast.error(message)
        return
      }
      toast.success(status === 'published' ? 'Page published.' : 'Page saved.')
      router.push('/admin/pages')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">New Page</h1>
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (!slugEdited) setSlug(toSlug(e.target.value))
              }}
              required
              className="mt-1 text-lg"
              placeholder="Page title"
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
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
            <Label>Content</Label>
            <div className="mt-1">
              <TiptapEditor content="" onChange={setContent} />
            </div>
          </div>
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
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save'}
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
        </div>
      </form>
    </DashboardLayout>
  )
}
