'use client'

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/admin/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiFetch, errorMessage } from '@/lib/admin-fetch'

type Term = { id: string; name: string; slug: string; count: number }
type Props = {
  selected: Set<string>
  onChange: (next: Set<string>) => void
  showCategories?: boolean
  showTags?: boolean
}

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const box = 'rounded-xl border border-border bg-card'
const link = 'text-xs font-medium text-primary underline-offset-4 hover:underline'

export function TaxonomyBoxes({
  selected,
  onChange,
  showCategories = true,
  showTags = true,
}: Props) {
  const toast = useToast()
  const [categories, setCategories] = useState<Term[]>([])
  const [tags, setTags] = useState<Term[]>([])
  const [catTab, setCatTab] = useState<'all' | 'popular'>('all')
  const [addingCat, setAddingCat] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [showCloud, setShowCloud] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([
      apiFetch<Term[]>('/api/admin/taxonomies?type=category'),
      apiFetch<Term[]>('/api/admin/taxonomies?type=tag'),
    ])
      .then(([c, t]) => {
        setCategories(c)
        setTags(t)
      })
      .catch((e) => toast.error(errorMessage(e)))
  }, [toast])

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  async function create(name: string, type: 'category' | 'tag') {
    const term = await apiFetch<Term>('/api/admin/taxonomies', {
      method: 'POST',
      body: JSON.stringify({ name, slug: toSlug(name) || crypto.randomUUID(), type }),
    })
    return { ...term, count: 0 }
  }

  async function addCategory() {
    const name = newCat.trim()
    if (!name) return
    const existing = categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      onChange(new Set(selected).add(existing.id))
      setNewCat('')
      return
    }
    setBusy(true)
    try {
      const term = await create(name, 'category')
      setCategories((prev) => [...prev, term].sort((a, b) => a.name.localeCompare(b.name)))
      onChange(new Set(selected).add(term.id))
      setNewCat('')
      setCatTab('all')
      toast.success(`Category "${term.name}" added.`)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function addTags(raw: string) {
    const names = [
      ...new Set(
        raw
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean)
      ),
    ]
    if (names.length === 0) return
    setBusy(true)
    const next = new Set(selected)
    const created: Term[] = []
    for (const name of names) {
      const existing = [...tags, ...created].find(
        (t) => t.name.toLowerCase() === name.toLowerCase()
      )
      if (existing) {
        next.add(existing.id)
        continue
      }
      try {
        const term = await create(name, 'tag')
        created.push(term)
        next.add(term.id)
      } catch (e) {
        toast.error(`${name}: ${errorMessage(e)}`)
      }
    }
    if (created.length > 0) setTags((prev) => [...prev, ...created])
    onChange(next)
    setTagInput('')
    setBusy(false)
  }

  const popularCats = [...categories]
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  const shownCats = catTab === 'all' ? categories : popularCats
  const selectedTags = tags.filter((t) => selected.has(t.id))
  const cloud = [...tags].sort((a, b) => b.count - a.count).slice(0, 45)
  const maxCount = Math.max(1, ...cloud.map((t) => t.count))

  return (
    <>
      {showCategories && (
        <div className={box}>
          <h3 className="border-b border-border px-4 py-3 text-sm font-semibold">Categories</h3>
          <div className="space-y-3 p-4">
            <div>
              <div className="flex text-xs" role="tablist">
                {(
                  [
                    ['all', 'All Categories'],
                    ['popular', 'Most Used'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={catTab === key}
                    onClick={() => setCatTab(key)}
                    className={`-mb-px rounded-t-md border px-3 py-1.5 ${
                      catTab === key
                        ? 'border-border border-b-background bg-background font-medium'
                        : 'border-transparent text-primary hover:underline'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="max-h-52 space-y-1 overflow-y-auto rounded-tr-md rounded-b-md border border-border bg-background p-3">
                {shownCats.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {catTab === 'all' ? 'No categories yet.' : 'No category has been used yet.'}
                  </p>
                ) : (
                  shownCats.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex cursor-pointer items-center gap-2 py-0.5 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(cat.id)}
                        onChange={() => toggle(cat.id)}
                        className="size-4 accent-primary"
                      />
                      {cat.name}
                    </label>
                  ))
                )}
              </div>
            </div>
            {addingCat ? (
              <div className="space-y-2">
                <Input
                  autoFocus
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCategory()
                    }
                    if (e.key === 'Escape') setAddingCat(false)
                  }}
                  placeholder="New category name"
                  aria-label="New category name"
                  className="h-8 text-sm"
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy || !newCat.trim()}
                    onClick={addCategory}
                  >
                    Add New Category
                  </Button>
                  <button type="button" className={link} onClick={() => setAddingCat(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className={link} onClick={() => setAddingCat(true)}>
                + Add Category
              </button>
            )}
          </div>
        </div>
      )}

      {showTags && (
        <div className={box}>
          <h3 className="border-b border-border px-4 py-3 text-sm font-semibold">Tags</h3>
          <div className="space-y-3 p-4">
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTags(tagInput)
                  }
                }}
                aria-label="Add tags"
                className="h-8 text-sm"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy || !tagInput.trim()}
                onClick={() => addTags(tagInput)}
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Separate tags with commas</p>
            {selectedTags.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => (
                  <li
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(tag.id)}
                      aria-label={`Remove tag ${tag.name}`}
                      className="rounded-full text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                    {tag.name}
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className={link} onClick={() => setShowCloud((v) => !v)}>
              Choose from the most used tags
            </button>
            {showCloud &&
              (cloud.length === 0 ? (
                <p className="text-xs text-muted-foreground">No tags yet.</p>
              ) : (
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {cloud.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => onChange(new Set(selected).add(tag.id))}
                      style={{ fontSize: `${0.75 + (tag.count / maxCount) * 0.5}rem` }}
                      className={`text-primary hover:underline ${selected.has(tag.id) ? 'opacity-50' : ''}`}
                      title={`${tag.count} post${tag.count === 1 ? '' : 's'}`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  )
}
