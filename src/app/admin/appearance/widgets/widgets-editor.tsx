'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/admin/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  WIDGET_AREAS,
  type Widget,
  type WidgetAreas,
  type WidgetType,
  widgetAreasSchema,
} from '@/core/validators'
import { apiFetch } from '@/lib/admin-fetch'

const LABELS: Record<WidgetType, string> = {
  search: 'Search',
  recentPosts: 'Recent Posts',
  categories: 'Categories',
  tags: 'Tag Cloud',
  text: 'Text',
  links: 'Links',
}

const AREA_LABELS: Record<(typeof WIDGET_AREAS)[number], string> = {
  sidebar: 'Blog sidebar',
  footer: 'Footer',
}

const NEW_WIDGET: Record<WidgetType, Widget> = {
  search: { type: 'search' },
  recentPosts: { type: 'recentPosts', title: 'Recent posts', count: 5 },
  categories: { type: 'categories', title: 'Categories' },
  tags: { type: 'tags', title: 'Tags' },
  text: { type: 'text', title: 'About', text: 'Write a short note about your site.' },
  links: {
    type: 'links',
    title: 'Links',
    links: [{ label: 'GitHub', href: 'https://github.com' }],
  },
}

const select =
  'h-9 rounded-md border bg-background px-3 pr-8 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

export function WidgetsEditor({ initial }: { initial: WidgetAreas }) {
  const toast = useToast()
  const [areas, setAreas] = useState<WidgetAreas>(initial)
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState<Record<string, WidgetType>>({})

  const update = (area: keyof WidgetAreas, fn: (list: Widget[]) => Widget[]) =>
    setAreas((a) => ({ ...a, [area]: fn(a[area]) }))

  const move = (area: keyof WidgetAreas, index: number, by: number) =>
    update(area, (list) => {
      const next = [...list]
      const [item] = next.splice(index, 1)
      next.splice(index + by, 0, item!)
      return next
    })

  async function save() {
    const parsed = widgetAreasSchema.safeParse(areas)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      toast.error(`${issue?.path.join(' › ')}: ${issue?.message}`)
      return
    }
    setSaving(true)
    await toast.run(async () => {
      setAreas(
        await apiFetch<WidgetAreas>('/api/admin/widgets', {
          method: 'PUT',
          body: JSON.stringify(parsed.data),
        })
      )
    }, 'Widgets saved.')
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {WIDGET_AREAS.map((area) => (
          <section key={area} className="rounded-lg border">
            <header className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
              <h2 className="font-semibold">{AREA_LABELS[area]}</h2>
              <span className="text-xs text-muted-foreground">
                {areas[area].length} widget{areas[area].length === 1 ? '' : 's'}
              </span>
            </header>
            <div className="space-y-3 p-4">
              {areas[area].length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No widgets. This area stays hidden on the site.
                </p>
              )}
              {areas[area].map((widget, index) => (
                <WidgetCard
                  key={`${area}-${index}`}
                  id={`${area}-${index}`}
                  widget={widget}
                  first={index === 0}
                  last={index === areas[area].length - 1}
                  onChange={(next) =>
                    update(area, (list) => list.map((w, i) => (i === index ? next : w)))
                  }
                  onMove={(by) => move(area, index, by)}
                  onRemove={() => update(area, (list) => list.filter((_, i) => i !== index))}
                />
              ))}
              <div className="flex gap-2 pt-1">
                <label htmlFor={`add-${area}`} className="sr-only">
                  Widget type
                </label>
                <select
                  id={`add-${area}`}
                  className={select}
                  value={adding[area] ?? 'recentPosts'}
                  onChange={(e) => setAdding({ ...adding, [area]: e.target.value as WidgetType })}
                >
                  {Object.entries(LABELS).map(([type, label]) => (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    update(area, (list) => [...list, NEW_WIDGET[adding[area] ?? 'recentPosts']])
                  }
                >
                  <Plus className="size-4" /> Add widget
                </Button>
              </div>
            </div>
          </section>
        ))}
      </div>
      <Button onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save widgets'}
      </Button>
    </div>
  )
}

function WidgetCard({
  id,
  widget,
  first,
  last,
  onChange,
  onMove,
  onRemove,
}: {
  id: string
  widget: Widget
  first: boolean
  last: boolean
  onChange: (widget: Widget) => void
  onMove: (by: number) => void
  onRemove: () => void
}) {
  const icon = 'rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground'
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{LABELS[widget.type]}</span>
        <div className="flex">
          <button
            type="button"
            className={`${icon} disabled:opacity-30`}
            disabled={first}
            onClick={() => onMove(-1)}
            aria-label="Move up"
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            className={`${icon} disabled:opacity-30`}
            disabled={last}
            onClick={() => onMove(1)}
            aria-label="Move down"
          >
            <ArrowDown className="size-4" />
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
            onClick={onRemove}
            aria-label={`Remove ${LABELS[widget.type]} widget`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 grid gap-3">
        <div>
          <Label htmlFor={`${id}-title`}>Title</Label>
          <Input
            id={`${id}-title`}
            value={widget.title ?? ''}
            maxLength={80}
            onChange={(e) => onChange({ ...widget, title: e.target.value })}
            className="mt-1"
          />
        </div>
        {widget.type === 'recentPosts' && (
          <div>
            <Label htmlFor={`${id}-count`}>Number of posts</Label>
            <Input
              id={`${id}-count`}
              type="number"
              min={1}
              max={10}
              value={widget.count}
              onChange={(e) => onChange({ ...widget, count: Number(e.target.value) })}
              className="mt-1 w-24"
            />
          </div>
        )}
        {widget.type === 'categories' && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={widget.showCounts ?? false}
              onChange={(e) => onChange({ ...widget, showCounts: e.target.checked })}
            />
            Show post counts
          </label>
        )}
        {widget.type === 'text' && (
          <div>
            <Label htmlFor={`${id}-text`}>Text</Label>
            <textarea
              id={`${id}-text`}
              value={widget.text}
              maxLength={1000}
              rows={4}
              onChange={(e) => onChange({ ...widget, text: e.target.value })}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        )}
        {widget.type === 'links' && (
          <div className="space-y-2">
            {widget.links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  aria-label={`Link ${i + 1} label`}
                  value={link.label}
                  placeholder="Label"
                  onChange={(e) =>
                    onChange({
                      ...widget,
                      links: widget.links.map((l, j) =>
                        j === i ? { ...l, label: e.target.value } : l
                      ),
                    })
                  }
                />
                <Input
                  aria-label={`Link ${i + 1} URL`}
                  value={link.href}
                  placeholder="https://"
                  onChange={(e) =>
                    onChange({
                      ...widget,
                      links: widget.links.map((l, j) =>
                        j === i ? { ...l, href: e.target.value.trim() } : l
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  className="rounded-md p-2 text-destructive hover:bg-destructive/10 disabled:opacity-30"
                  disabled={widget.links.length === 1}
                  onClick={() =>
                    onChange({ ...widget, links: widget.links.filter((_, j) => j !== i) })
                  }
                  aria-label={`Remove link ${i + 1}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={widget.links.length >= 10}
              onClick={() =>
                onChange({ ...widget, links: [...widget.links, { label: '', href: '' }] })
              }
            >
              <Plus className="size-4" /> Add link
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
