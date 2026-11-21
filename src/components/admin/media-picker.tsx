'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Check, ImageIcon, Loader2, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type MediaItem = { id: string; filename: string; url: string; mimeType: string; alt: string | null }

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
  title?: string
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  title = 'Choose from Media Library',
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      setSelected('')
      setItems(null)
      fetch('/api/admin/media')
        .then((r) => (r.ok ? r.json() : []))
        .then((rows: MediaItem[]) => setItems(rows.filter((m) => m.mimeType.startsWith('image/'))))
        .catch(() => setItems([]))
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  const q = query.trim().toLowerCase()
  const visible = (items ?? []).filter((m) => !q || m.filename.toLowerCase().includes(q))

  function confirm() {
    if (!selected) return
    onSelect(selected)
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm open:flex open:flex-col"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search images"
            aria-label="Search images"
            className="h-9 w-full rounded-md border border-input bg-background pr-3 pl-9 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {items === null ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading media…
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <ImageIcon className="size-6" />
              {items.length === 0 ? 'No images uploaded yet.' : 'No images match your search.'}
            </div>
          ) : (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {visible.map((m) => {
                const active = selected === m.url
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(m.url)}
                      onDoubleClick={() => {
                        onSelect(m.url)
                        onClose()
                      }}
                      aria-pressed={active}
                      title={m.filename}
                      className={`relative block aspect-square w-full overflow-hidden rounded-lg border-2 bg-muted transition ${active ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-border'}`}
                    >
                      <Image
                        src={m.url}
                        alt={m.alt ?? m.filename}
                        width={160}
                        height={160}
                        unoptimized
                        className="size-full object-cover"
                      />
                      {active && (
                        <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3.5" />
                        </span>
                      )}
                    </button>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{m.filename}</p>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={confirm} disabled={!selected}>
          Use selected image
        </Button>
      </div>
    </dialog>
  )
}
