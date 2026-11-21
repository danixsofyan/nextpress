'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Check, Copy, ExternalLink, FileIcon, Loader2, Trash2, Upload } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { useToast } from '@/components/admin/toast'
import { apiFetch } from '@/lib/admin-fetch'
import { type Column, DataTable, type FilterOption } from '@/components/admin/data-table'
import { DashboardLayout } from '@/components/admin/dashboard-layout'

type MediaItem = {
  id: string
  filename: string
  url: string
  mimeType: string
  size: number
  alt: string | null
  createdAt: string
}

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`

const columns: Column<MediaItem>[] = [
  {
    key: 'file',
    header: 'File',
    sortValue: (m) => m.filename.toLowerCase(),
    cell: (m) => (
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          {m.mimeType.startsWith('image/') ? (
            <Image
              src={m.url}
              alt={m.alt ?? ''}
              width={48}
              height={48}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <FileIcon className="size-5 text-muted-foreground" />
          )}
        </div>
        <span className="font-medium break-all">{m.filename}</span>
      </div>
    ),
  },
  {
    key: 'type',
    header: 'Type',
    sortValue: (m) => m.mimeType,
    cell: (m) => <span className="text-muted-foreground">{m.mimeType}</span>,
  },
  {
    key: 'size',
    header: 'Size',
    sortValue: (m) => m.size,
    cell: (m) => <span className="text-muted-foreground">{formatSize(m.size)}</span>,
  },
  {
    key: 'date',
    header: 'Uploaded',
    sortValue: (m) => m.createdAt,
    cell: (m) => (
      <span className="text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</span>
    ),
  },
]

const filters: FilterOption<MediaItem>[] = [
  { value: 'image', label: 'Images', match: (m) => m.mimeType.startsWith('image/') },
  { value: 'video', label: 'Video', match: (m) => m.mimeType.startsWith('video/') },
  { value: 'audio', label: 'Audio', match: (m) => m.mimeType.startsWith('audio/') },
  { value: 'document', label: 'Documents', match: (m) => m.mimeType === 'application/pdf' },
]

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const toast = useToast()
  const confirm = useConfirm()
  const [progress, setProgress] = useState<{ current: number; total: number; name: string } | null>(
    null
  )
  const uploading = progress !== null
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/media')
    setItems(res.ok ? await res.json() : [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function upload(files: FileList | null) {
    if (!files?.length) return
    const list = Array.from(files)
    let uploaded = 0
    for (const [index, file] of list.entries()) {
      setProgress({ current: index + 1, total: list.length, name: file.name })
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/media', { method: 'POST', body: form })
      if (res.ok) {
        uploaded++
        continue
      }
      const body = await res.json().catch(() => ({}))
      const reason =
        res.status === 413 ? 'file is too large' : (body.error ?? `upload failed (${res.status})`)
      toast.error(`${file.name}: ${reason}`)
    }
    if (uploaded > 0) toast.success(`${uploaded} file${uploaded === 1 ? '' : 's'} uploaded.`)
    await load()
    setProgress(null)
  }

  async function remove(rows: MediaItem[]) {
    try {
      await Promise.all(rows.map((m) => apiFetch(`/api/admin/media/${m.id}`, { method: 'DELETE' })))
    } finally {
      await load()
    }
  }

  async function copyUrl(item: MediaItem) {
    await navigator.clipboard.writeText(new URL(item.url, window.location.origin).href)
    toast.success('URL copied to clipboard.')
    setCopied(item.id)
    setTimeout(() => setCopied(''), 1500)
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          upload(e.dataTransfer.files)
        }}
        aria-busy={uploading}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-sm text-muted-foreground transition-colors ${uploading ? 'pointer-events-none border-primary/50' : 'cursor-pointer'} ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}
      >
        {uploading && progress ? (
          <>
            <Loader2 className="mb-2 size-6 animate-spin text-primary" />
            <span className="font-medium text-foreground">
              Uploading {progress.current} of {progress.total}…
            </span>
            <span className="mt-1 max-w-full truncate text-xs">{progress.name}</span>
            <div className="mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${((progress.current - 1) / progress.total) * 100 + 100 / progress.total / 2}%`,
                }}
              />
            </div>
          </>
        ) : (
          <>
            <Upload className="mb-2 size-6" />
            Drop files here or click to upload
            <span className="mt-1 text-xs">Images, MP4/WebM video, MP3 audio, PDF · max 4 MB</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            upload(e.target.files)
            e.target.value = ''
          }}
        />
      </label>

      <DataTable
        rows={items}
        rowId={(m) => m.id}
        columns={columns}
        searchText={(m) => `${m.filename} ${m.mimeType} ${m.alt ?? ''}`}
        searchPlaceholder="Search media"
        filters={filters}
        bulkActions={[
          {
            label: 'Delete permanently',
            run: remove,
            confirm: (n) =>
              `Delete ${n} file${n === 1 ? '' : 's'} permanently? This cannot be undone.`,
          },
        ]}
        defaultSort={{ key: 'date', dir: 'desc' }}
        emptyMessage="No media uploaded yet."
        rowActions={(m) => (
          <>
            <button
              type="button"
              onClick={() => copyUrl(m)}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Copy URL of ${m.filename}`}
            >
              {copied === m.id ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
            <a
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Open ${m.filename}`}
            >
              <ExternalLink className="size-4" />
            </a>
            <button
              type="button"
              onClick={async () => {
                if (await confirm(`Delete "${m.filename}" permanently?`))
                  toast.run(() => remove([m]), 'File deleted.')
              }}
              className="rounded-md p-2 text-destructive hover:bg-destructive/10"
              aria-label={`Delete ${m.filename}`}
            >
              <Trash2 className="size-4" />
            </button>
          </>
        )}
      />
    </DashboardLayout>
  )
}
