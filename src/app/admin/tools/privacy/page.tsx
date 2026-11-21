'use client'

import { Download, Search, ShieldOff } from 'lucide-react'
import { useState } from 'react'
import { useConfirm } from '@/components/admin/confirm-dialog'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { useToast } from '@/components/admin/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch, errorMessage } from '@/lib/admin-fetch'

type Result = {
  account: { name: string; email: string; role: string | null } | null
  comments: { id: string; authorName: string; content: string; post: string }[]
  donations: { orderId: string; donorName: string | null; amount: number }[]
}

export default function PrivacyPage() {
  const toast = useToast()
  const confirm = useConfirm()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)

  const query = () => ({
    ...(name.trim() && { name: name.trim() }),
    ...(email.trim() && { email: email.trim() }),
  })
  const matchName = () => name.trim() || result?.account?.name || ''

  async function search(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      setResult(
        await apiFetch<Result>('/api/admin/privacy', {
          method: 'POST',
          body: JSON.stringify(query()),
        })
      )
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function download() {
    const res = await fetch('/api/admin/privacy?download=1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query()),
    })
    if (!res.ok) return toast.error('Export failed')
    const url = URL.createObjectURL(await res.blob())
    const link = document.createElement('a')
    link.href = url
    link.download = 'personal-data.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function erase() {
    const target = matchName()
    const ok = await confirm({
      title: `Erase the personal data of “${target}”?`,
      description:
        'Comments keep their text but show “Anonymous”, and donations lose their name and message. User accounts are removed under Users. This cannot be undone.',
      confirmLabel: 'Erase',
      destructive: true,
    })
    if (!ok) return
    const done = await toast.run(
      () =>
        apiFetch('/api/admin/privacy', {
          method: 'DELETE',
          body: JSON.stringify({ name: target }),
        }),
      'Personal data erased.'
    )
    if (done) setResult(null)
  }

  const total = result
    ? result.comments.length + result.donations.length + (result.account ? 1 : 0)
    : 0

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold">Privacy</h1>
        <p className="text-sm text-muted-foreground">
          Answer requests to export or erase someone&apos;s personal data. Comments and donations
          keep names but never email addresses, so search by the name they used.
        </p>
      </div>
      <form onSubmit={search} className="grid max-w-2xl gap-4 rounded-lg border p-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="privacy-name">Name</Label>
          <Input
            id="privacy-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="privacy-email">Email (user accounts)</Label>
          <Input
            id="privacy-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button
          type="submit"
          disabled={busy || (!name.trim() && !email.trim())}
          className="sm:col-span-2 sm:w-fit"
        >
          <Search className="size-4" /> Find personal data
        </Button>
      </form>
      {result && (
        <section className="max-w-2xl space-y-4 rounded-lg border p-5">
          <h2 className="font-semibold">
            {total === 0 ? 'Nothing found' : `${total} item${total === 1 ? '' : 's'} found`}
          </h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              User account:{' '}
              {result.account
                ? `${result.account.name} <${result.account.email}> (${result.account.role ?? 'author'})`
                : 'none'}
            </li>
            <li>Comments: {result.comments.length}</li>
            <li>Donations: {result.donations.length}</li>
          </ul>
          {total > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={download}>
                <Download className="size-4" /> Download JSON
              </Button>
              {matchName() && (result.comments.length > 0 || result.donations.length > 0) && (
                <Button variant="destructive" onClick={erase}>
                  <ShieldOff className="size-4" /> Erase comments and donations
                </Button>
              )}
            </div>
          )}
        </section>
      )}
    </DashboardLayout>
  )
}
