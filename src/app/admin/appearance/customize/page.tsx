'use client'

import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { ThemeSwatch } from '@/components/admin/theme-swatch'
import { AdditionalCss } from './additional-css'
import { useToast } from '@/components/admin/toast'
import { apiFetch, errorMessage } from '@/lib/admin-fetch'
import type { getAppearance } from '@/lib/themes'
import { THEME_FONTS, THEME_RADII, type ThemeStyle, themeStyleSchema } from '@/core/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, ExternalLink, RotateCcw, Upload } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

type Appearance = Awaited<ReturnType<typeof getAppearance>>
type ColorKey = 'primary' | 'background' | 'foreground' | 'accent'

const COLORS: { key: ColorKey; label: string; hint: string }[] = [
  { key: 'primary', label: 'Primary', hint: 'Buttons, links, highlights' },
  { key: 'background', label: 'Background', hint: 'Page background' },
  { key: 'foreground', label: 'Text', hint: 'Headings and body text' },
  { key: 'accent', label: 'Accent', hint: 'Soft panels and badges' },
]

const select =
  'mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export default function CustomizePage() {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [data, setData] = useState<Appearance | null>(null)
  const [themeId, setThemeId] = useState('')
  const [style, setStyle] = useState<ThemeStyle | null>(null)
  const [saving, setSaving] = useState(false)

  const pick = useCallback((appearance: Appearance, id: string) => {
    const theme = appearance.themes.find((t) => t.id === id) ?? appearance.themes[0]
    if (!theme) return
    setThemeId(theme.id)
    setStyle(theme.style)
  }, [])

  useEffect(() => {
    apiFetch<Appearance>('/api/admin/appearance')
      .then((appearance) => {
        setData(appearance)
        const wanted = new URLSearchParams(window.location.search).get('theme')
        pick(appearance, wanted ?? appearance.active)
      })
      .catch((e) => toast.error(errorMessage(e)))
  }, [pick, toast])

  const theme = data?.themes.find((t) => t.id === themeId)
  const set = <K extends keyof ThemeStyle>(key: K, value: ThemeStyle[K]) =>
    setStyle((s) => (s ? { ...s, [key]: value } : s))

  async function save(next: ThemeStyle | null, message: string) {
    setSaving(true)
    await toast.run(async () => {
      const appearance = await apiFetch<Appearance>('/api/admin/appearance', {
        method: 'PUT',
        body: JSON.stringify({ styles: { [themeId]: next } }),
      })
      setData(appearance)
      pick(appearance, themeId)
    }, message)
    setSaving(false)
  }

  function exportJson() {
    if (!style) return
    const blob = new Blob([JSON.stringify({ theme: themeId, style }, null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `nextpress-${themeId}-style.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function importJson(file: File) {
    try {
      const raw = JSON.parse(await file.text())
      const parsed = themeStyleSchema.safeParse(raw?.style ?? raw)
      if (!parsed.success) {
        const issue = parsed.error.issues[0]
        throw new Error(`Invalid style file: ${issue?.path.join('.')} ${issue?.message}`)
      }
      setStyle(parsed.data)
      toast.success('Style imported. Review the preview, then save.')
    } catch (e) {
      toast.error(e instanceof SyntaxError ? 'That file is not valid JSON' : errorMessage(e))
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Customize</h1>
          <p className="text-sm text-muted-foreground">
            Changes apply to the public site as soon as you save. No deploy needed.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/appearance">All themes</Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="/" target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              View site
            </a>
          </Button>
        </div>
      </div>

      {!data || !style || !theme ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="space-y-5 rounded-lg border bg-card p-5">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                className={select}
                value={themeId}
                onChange={(e) => pick(data, e.target.value)}
              >
                {data.themes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                    {t.id === data.active ? ' (active)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {COLORS.map((c) => (
              <div key={c.key}>
                <Label htmlFor={c.key}>{c.label}</Label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={`${c.label} color picker`}
                    value={style[c.key]}
                    onChange={(e) => set(c.key, e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
                  />
                  <Input
                    id={c.key}
                    value={style[c.key]}
                    maxLength={7}
                    onChange={(e) => set(c.key, e.target.value)}
                    className="font-mono"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="font">Font</Label>
                <select
                  id="font"
                  className={select}
                  value={style.font}
                  onChange={(e) => set('font', e.target.value as ThemeStyle['font'])}
                >
                  {THEME_FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="radius">Corners</Label>
                <select
                  id="radius"
                  className={select}
                  value={style.radius}
                  onChange={(e) => set('radius', e.target.value as ThemeStyle['radius'])}
                >
                  {THEME_RADII.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="scheme">Default color scheme</Label>
              <select
                id="scheme"
                className={select}
                value={style.scheme ?? 'dark'}
                onChange={(e) => set('scheme', e.target.value as 'dark' | 'light')}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Visitors can still switch with the sun and moon button.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button
                disabled={saving}
                onClick={() => {
                  const parsed = themeStyleSchema.safeParse(style)
                  if (!parsed.success) {
                    toast.error(parsed.error.issues[0]?.message ?? 'Invalid style')
                    return
                  }
                  save(parsed.data, `${theme.label} style saved.`)
                }}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button
                variant="outline"
                disabled={saving || !theme.customized}
                onClick={() => save(null, `${theme.label} reset to its defaults.`)}
              >
                <RotateCcw className="size-4" />
                Reset
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={exportJson}>
                <Download className="size-4" />
                Export JSON
              </Button>
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="size-4" />
                Import JSON
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) importJson(file)
                  e.target.value = ''
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Live preview</p>
            <div className="overflow-hidden rounded-lg border">
              {themeStyleSchema.safeParse(style).success ? (
                <ThemeSwatch style={style} title={theme.label} />
              ) : (
                <p className="p-5 text-sm text-muted-foreground">
                  Enter 6-digit hex colors like #0f172a to see the preview.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      <AdditionalCss />
    </DashboardLayout>
  )
}
