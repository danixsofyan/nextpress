'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { DashboardLayout } from '@/components/admin/dashboard-layout'

type ImporterKey = 'wordpress' | 'rss'

type Summary = { total: number; created: number; skipped: number; failed: number; errors: string[] }

const IMPORTERS: { key: ImporterKey; name: string; description: string }[] = [
  {
    key: 'wordpress',
    name: 'WordPress',
    description:
      'Import posts, pages, categories, and tags from a WordPress export file (Tools → Export in WordPress).',
  },
  {
    key: 'rss',
    name: 'RSS / Atom feed',
    description:
      'Import posts from any RSS or Atom feed, by URL or file. Works with Blogger, Medium, Substack, Ghost, and most blogs.',
  },
]

function ImporterForm({ type }: { type: ImporterKey }) {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'keep' | 'draft'>('keep')
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState('')

  async function run(e: React.FormEvent) {
    e.preventDefault()
    setRunning(true)
    setSummary(null)
    setError('')
    const form = new FormData()
    form.append('type', type)
    form.append('status', status)
    if (file) form.append('file', file)
    if (type === 'rss' && url) form.append('url', url)
    const res = await fetch('/api/admin/import', { method: 'POST', body: form })
    const body = await res.json().catch(() => ({}))
    setRunning(false)
    if (!res.ok) {
      setError(body.error ?? 'Import failed')
      return
    }
    setSummary(body)
  }

  return (
    <form onSubmit={run} className="space-y-4 border-t border-border bg-muted/30 p-4">
      <div className="space-y-1.5">
        <Label htmlFor={`${type}-file`}>
          {type === 'wordpress' ? 'WordPress export file (.xml)' : 'Feed file (.xml)'}
        </Label>
        <Input
          id={`${type}-file`}
          type="file"
          accept=".xml,application/xml,text/xml,application/rss+xml,application/atom+xml"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {type === 'rss' && (
        <div className="space-y-1.5">
          <Label htmlFor="rss-url">Or feed URL</Label>
          <Input
            id="rss-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/feed"
          />
        </div>
      )}
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Status of imported items</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={`${type}-status`}
            checked={status === 'keep'}
            onChange={() => setStatus('keep')}
          />
          Keep original status
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={`${type}-status`}
            checked={status === 'draft'}
            onChange={() => setStatus('draft')}
          />
          Import everything as draft
        </label>
      </fieldset>
      <p className="text-xs text-muted-foreground">
        Items whose slug already exists are skipped, so running an importer twice is safe. Maximum
        file size is 20 MB.
      </p>
      <Button type="submit" disabled={running || (!file && !(type === 'rss' && url))}>
        {running && <Loader2 className="size-4 animate-spin" />}
        {running ? 'Importing…' : 'Run importer'}
      </Button>

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="size-4" />
          {error}
        </p>
      )}
      {summary && (
        <output className="block space-y-2 rounded-lg border border-border bg-background p-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="size-4 text-green-600" />
            Import finished: {summary.total} items found
          </p>
          <ul className="grid grid-cols-3 gap-2 text-center text-sm">
            <li className="rounded-md bg-muted p-2">
              <span className="block text-lg font-semibold">{summary.created}</span>created
            </li>
            <li className="rounded-md bg-muted p-2">
              <span className="block text-lg font-semibold">{summary.skipped}</span>skipped
            </li>
            <li className="rounded-md bg-muted p-2">
              <span className="block text-lg font-semibold">{summary.failed}</span>failed
            </li>
          </ul>
          {summary.errors.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-destructive">
              {summary.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </output>
      )}
    </form>
  )
}

export default function ImportPage() {
  const [open, setOpen] = useState<ImporterKey | null>(null)

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold">Import</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          If you have posts in another system, NextPress can import them into this site. Choose a
          system to import from below.
        </p>
      </div>

      <div className="max-w-4xl overflow-hidden rounded-xl border border-border bg-card">
        {IMPORTERS.map((importer, index) => (
          <div key={importer.key} className={index > 0 ? 'border-t border-border' : ''}>
            <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="sm:w-52">
                <h2 className="text-sm font-semibold">{importer.name}</h2>
                <button
                  type="button"
                  onClick={() => setOpen(open === importer.key ? null : importer.key)}
                  className="mt-1 text-sm text-primary underline underline-offset-2"
                  aria-expanded={open === importer.key}
                >
                  {open === importer.key ? 'Close' : 'Run importer'}
                </button>
              </div>
              <p className="flex-1 text-sm text-muted-foreground">{importer.description}</p>
            </div>
            {open === importer.key && <ImporterForm type={importer.key} />}
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
