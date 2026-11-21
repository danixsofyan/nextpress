'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/admin/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/admin-fetch'

const slugOf = (title: string) =>
  `${
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'draft'
  }-${Date.now().toString(36)}`

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function QuickDraft() {
  const router = useRouter()
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    const ok = await toast.run(
      () =>
        apiFetch('/api/admin/posts', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            slug: slugOf(title),
            status: 'draft',
            content: content
              .split(/\n{2,}/)
              .filter((p) => p.trim())
              .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
              .join(''),
          }),
        }),
      'Draft saved.'
    )
    setSaving(false)
    if (ok) {
      setTitle('')
      setContent('')
      router.refresh()
    }
  }

  return (
    <form onSubmit={save} className="space-y-3">
      <div>
        <Label htmlFor="quick-draft-title">Title</Label>
        <Input
          id="quick-draft-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={500}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="quick-draft-content">Content</Label>
        <textarea
          id="quick-draft-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="What's on your mind?"
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
      </div>
      <Button type="submit" disabled={saving || !title.trim()}>
        {saving ? 'Saving…' : 'Save Draft'}
      </Button>
    </form>
  )
}
