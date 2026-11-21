'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'
import { apiFetch, errorMessage } from '@/lib/admin-fetch'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { TaxonomyBoxes } from '@/components/admin/editor/taxonomy-boxes'
import { ImageField } from '@/components/admin/image-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TiptapEditor } from '@/components/admin/editor/tiptap-editor'
import { SeoPanel } from '@/components/admin/editor/seo-panel'
import { RevisionsPanel } from '@/components/admin/editor/revisions-panel'
import { FileText, LayoutGrid, Film, Music2, Globe, EyeOff, Eye } from 'lucide-react'

type ScreenOpts = {
  format: boolean
  categories: boolean
  tags: boolean
  excerpt: boolean
  seo: boolean
}

const POST_FORMATS = [
  { value: 'standard', label: 'Standard', icon: FileText },
  { value: 'gallery', label: 'Gallery', icon: LayoutGrid },
  { value: 'video', label: 'Video', icon: Film },
  { value: 'audio', label: 'Audio', icon: Music2 },
]

const SCREEN_OPTS_KEY = 'nextpress-screen-options-post'

const toLocalInput = (iso: string) => {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export default function EditPostPage() {
  const router = useRouter()
  const toast = useToast()
  const confirm = useConfirm()
  const { id } = useParams<{ id: string }>()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [editingSlug, setEditingSlug] = useState(false)
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [status, setStatus] = useState('draft')
  const [savedStatus, setSavedStatus] = useState('draft')
  const [format, setFormat] = useState('standard')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [isSticky, setIsSticky] = useState(false)
  const [coverImage, setCoverImage] = useState('')
  const [publishDate, setPublishDate] = useState('')
  const [showStatus, setShowStatus] = useState(false)
  const [showVisibility, setShowVisibility] = useState(false)
  const [showDate, setShowDate] = useState(false)
  const [showScreenOpts, setShowScreenOpts] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [focusKeyphrase, setFocusKeyphrase] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedTaxIds, setSelectedTaxIds] = useState<Set<string>>(new Set())
  const [screenOpts, setScreenOpts] = useState<ScreenOpts>({
    format: true,
    categories: true,
    tags: true,
    excerpt: true,
    seo: true,
  })

  useEffect(() => {
    fetch(`/api/admin/posts/${id}`)
      .then((r) => r.json())
      .then((post) => {
        setTitle(post.title ?? '')
        setSlug(post.slug ?? '')
        setContent(post.content ?? '')
        setExcerpt(post.excerpt ?? '')
        setStatus(post.status ?? 'draft')
        setSavedStatus(post.status ?? 'draft')
        setMetaTitle(post.metaTitle ?? '')
        setMetaDescription(post.metaDescription ?? '')
        if (post.taxonomyIds?.length) setSelectedTaxIds(new Set(post.taxonomyIds))
        setVisibility(post.visibility === 'private' ? 'private' : 'public')
        setFormat(post.format ?? 'standard')
        setIsSticky(Boolean(post.isSticky))
        setCoverImage(post.coverImage ?? '')
        if (post.publishedAt) setPublishDate(toLocalInput(post.publishedAt))
        setLoading(false)
      })
    try {
      const saved = localStorage.getItem(SCREEN_OPTS_KEY)
      if (saved) setScreenOpts(JSON.parse(saved))
    } catch {}
  }, [id])

  function updateScreenOpts(key: keyof ScreenOpts, val: boolean) {
    const next = { ...screenOpts, [key]: val }
    setScreenOpts(next)
    try {
      localStorage.setItem(SCREEN_OPTS_KEY, JSON.stringify(next))
    } catch {}
  }

  async function save(overrideStatus?: string) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt: excerpt || undefined,
          content,
          status: overrideStatus ?? status,
          metaTitle: metaTitle || undefined,
          metaDescription: metaDescription || undefined,
          taxonomyIds: [...selectedTaxIds],
          visibility,
          format,
          isSticky: visibility === 'public' && isSticky,
          coverImage: coverImage || null,
          ...(publishDate && { publishedAt: new Date(publishDate).toISOString() }),
        }),
      })
      if (!res.ok) {
        const message = (await res.json()).error ?? 'Failed to save'
        setError(message)
        toast.error(message)
        return
      }
      toast.success(
        scheduled
          ? 'Post scheduled.'
          : (overrideStatus ?? status) === 'published'
            ? 'Post published.'
            : 'Post saved.'
      )
      router.push('/admin/posts')
    } finally {
      setSaving(false)
    }
  }

  const isPublished = savedStatus === 'published'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    save(isPublished ? status : 'published')
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete this post?',
      description: `"${title}" will be deleted permanently. This cannot be undone.`,
      destructive: true,
    })
    if (!ok) return
    try {
      await apiFetch(`/api/admin/posts/${id}`, { method: 'DELETE' })
    } catch (error) {
      toast.error(errorMessage(error))
      return
    }
    toast.success('Post deleted.')
    router.push('/admin/posts')
  }

  const visibilityLabel =
    visibility === 'private' ? 'Private' : isSticky ? 'Public, sticky' : 'Public'
  const VisibilityIcon = visibility === 'private' ? EyeOff : Globe
  const scheduled = Boolean(publishDate) && new Date(publishDate).getTime() > Date.now()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  if (loading)
    return (
      <DashboardLayout>
        <div className="p-8 text-muted-foreground">Loading...</div>
      </DashboardLayout>
    )

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Post</h1>
        <div className="relative">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowScreenOpts(!showScreenOpts)}
            className="text-xs"
          >
            Screen Options {showScreenOpts ? '▲' : '▼'}
          </Button>
          {showScreenOpts && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowScreenOpts(false)}
                onKeyDown={(e) => e.key === 'Escape' && setShowScreenOpts(false)}
                role="presentation"
              />
              <div className="absolute top-full right-0 z-20 mt-1 w-72 rounded-lg border border-border bg-background p-4 shadow-lg">
                <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase">
                  Show on screen
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {(Object.keys(screenOpts) as Array<keyof ScreenOpts>).map((key) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-1.5 text-sm capitalize"
                    >
                      <input
                        type="checkbox"
                        checked={screenOpts[key]}
                        onChange={(e) => updateScreenOpts(key, e.target.checked)}
                      />
                      {key}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="text-xl font-medium"
              placeholder="Post title"
            />
          </div>

          {slug && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Permalink:</span>
              {editingSlug ? (
                <>
                  <span className="text-muted-foreground">{origin}/blog/</span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    pattern="[a-z0-9-]+"
                    className="h-7 w-40 font-mono text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setEditingSlug(false)}
                  >
                    OK
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => setEditingSlug(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <a
                    href={`${origin}/blog/${slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {origin}/blog/{slug}
                  </a>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() => setEditingSlug(true)}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
          )}

          <div>
            <div className="mt-1">
              <TiptapEditor content={content} onChange={setContent} />
            </div>
          </div>

          {screenOpts.excerpt && (
            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                placeholder="Short summary shown in post lists..."
              />
            </div>
          )}

          {screenOpts.seo && (
            <SeoPanel
              title={title}
              slug={slug}
              metaTitle={metaTitle}
              metaDescription={metaDescription}
              focusKeyphrase={focusKeyphrase}
              onMetaTitleChange={setMetaTitle}
              onMetaDescriptionChange={setMetaDescription}
              onFocusKeyphraseChange={setFocusKeyphrase}
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Publish</h3>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex justify-between gap-2">
                {isPublished ? (
                  <span />
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    disabled={saving}
                    onClick={() => save('draft')}
                  >
                    Save Draft
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() =>
                    window.open(
                      `/api/admin/preview?path=${encodeURIComponent(`/blog/${slug}`)}`,
                      '_blank'
                    )
                  }
                >
                  <Eye className="mr-1 size-3.5" /> {isPublished ? 'Preview Changes' : 'Preview'}
                </Button>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex items-start justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  {showStatus ? (
                    <div className="flex flex-col gap-1.5">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="rounded border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setShowStatus(false)}
                        >
                          OK
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={() => setShowStatus(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2 text-sm">
                      <span className="capitalize">{status}</span>
                      <button
                        type="button"
                        onClick={() => setShowStatus(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Edit
                      </button>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start justify-between text-sm">
                <span className="text-muted-foreground">Visibility:</span>
                {showVisibility ? (
                  <div className="flex flex-col gap-1.5">
                    {(
                      [
                        { value: 'public', label: 'Public', Icon: Globe },
                        { value: 'private', label: 'Private', Icon: EyeOff },
                      ] as const
                    ).map(({ value, label, Icon }) => (
                      <label key={value} className="flex cursor-pointer items-center gap-2 text-xs">
                        <input
                          type="radio"
                          name="visibility"
                          value={value}
                          checked={visibility === value}
                          onChange={() => setVisibility(value)}
                        />
                        <Icon className="size-3" /> {label}
                      </label>
                    ))}
                    {visibility === 'public' && (
                      <label className="mt-1 flex cursor-pointer items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={isSticky}
                          onChange={(e) => setIsSticky(e.target.checked)}
                        />
                        Stick to the top of the blog
                      </label>
                    )}
                    <div className="flex gap-1 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setShowVisibility(false)}
                      >
                        OK
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => setShowVisibility(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <span className="flex items-center gap-2 text-sm">
                    <VisibilityIcon className="size-3.5 text-muted-foreground" />
                    <span>{visibilityLabel}</span>
                    <button
                      type="button"
                      onClick={() => setShowVisibility(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                  </span>
                )}
              </div>

              <div className="flex items-start justify-between text-sm">
                <span className="text-muted-foreground">Publish:</span>
                {showDate ? (
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="datetime-local"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      className="rounded border border-input bg-background px-2 py-1 text-xs"
                    />
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setShowDate(false)}
                      >
                        OK
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => setShowDate(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <span className="flex items-center gap-2 text-sm">
                    <span>
                      {publishDate
                        ? `${scheduled ? 'Scheduled for ' : ''}${new Date(publishDate).toLocaleString()}`
                        : status === 'published'
                          ? 'Published'
                          : 'Immediately'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDate(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                  </span>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="-mx-4 -mb-4 flex items-center justify-between gap-2 border-t border-border bg-muted/40 px-4 py-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs text-destructive hover:underline"
                >
                  Delete
                </button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : scheduled ? 'Schedule' : isPublished ? 'Update' : 'Publish'}
                </Button>
              </div>
            </div>
          </div>

          {screenOpts.format && (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">Format</h3>
              <div className="space-y-2">
                {POST_FORMATS.map(({ value, label, icon: Icon }) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="format"
                      value={value}
                      checked={format === value}
                      onChange={() => setFormat(value)}
                      className="accent-primary"
                    />
                    <Icon className="size-3.5 text-muted-foreground" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <RevisionsPanel postId={id} onRestored={() => window.location.reload()} />

          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">Featured image</h3>
            <ImageField
              id="cover_image"
              label="Featured image"
              hint="Shown on the post, in post lists, and when the post is shared. About 1200×630 px works well."
              value={coverImage}
              onChange={setCoverImage}
              previewClassName="aspect-[1200/630] w-full"
              compact
            />
          </div>

          <TaxonomyBoxes
            selected={selectedTaxIds}
            onChange={setSelectedTaxIds}
            showCategories={screenOpts.categories}
            showTags={screenOpts.tags}
          />
        </div>
      </form>
    </DashboardLayout>
  )
}
