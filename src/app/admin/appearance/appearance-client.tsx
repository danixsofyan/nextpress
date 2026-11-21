'use client'

import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { ThemeSwatch } from '@/components/admin/theme-swatch'
import { useToast } from '@/components/admin/toast'
import { apiFetch, errorMessage } from '@/lib/admin-fetch'
import type { getAppearance } from '@/lib/themes'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Eye, Paintbrush } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Appearance = Awaited<ReturnType<typeof getAppearance>>

export function AppearanceClient({ initialData }: { initialData?: Appearance }) {
  const toast = useToast()
  const [data, setData] = useState<Appearance | null>(initialData ?? null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) return
    apiFetch<Appearance>('/api/admin/appearance')
      .then(setData)
      .catch((e) => toast.error(errorMessage(e)))
  }, [toast, initialData])

  async function activate(id: string, label: string) {
    setBusy(id)
    await toast.run(async () => {
      setData(
        await apiFetch<Appearance>('/api/admin/appearance', {
          method: 'PUT',
          body: JSON.stringify({ active: id }),
        })
      )
    }, `${label} is now the active theme.`)
    setBusy(null)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Themes</h1>
          <p className="text-sm text-muted-foreground">
            Themes ship as code in <code>themes/&lt;name&gt;</code>. Colors, font, and corners are
            customized here without a deploy.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/appearance/customize">
            <Paintbrush className="size-4" />
            Customize
          </Link>
        </Button>
      </div>

      {!data ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading themes…</p>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {data.themes.map((t) => {
            const active = t.id === data.active
            return (
              <div
                key={t.id}
                className={`overflow-hidden rounded-lg border bg-card ${active ? 'ring-2 ring-primary' : ''}`}
              >
                <ThemeSwatch style={t.style} title={t.label} />
                <div className="space-y-3 border-t p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold">
                      {t.label}{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        v{t.version}
                      </span>
                    </h2>
                    {active && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                        <CheckCircle2 className="size-4" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {!active && (
                      <Button
                        size="sm"
                        disabled={busy !== null}
                        onClick={() => activate(t.id, t.label)}
                      >
                        {busy === t.id ? 'Activating…' : 'Activate'}
                      </Button>
                    )}
                    {!active && (
                      <form method="post" action="/api/admin/appearance/preview" target="_blank">
                        <input type="hidden" name="theme" value={t.id} />
                        <Button size="sm" variant="outline" type="submit">
                          <Eye className="size-4" />
                          Live preview
                        </Button>
                      </form>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/appearance/customize?theme=${t.id}`}>
                        <Paintbrush className="size-4" />
                        Customize
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
