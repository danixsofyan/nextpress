'use client'

import { useEffect, useState } from 'react'
import { useToast } from '@/components/admin/toast'
import { Button } from '@/components/ui/button'
import { CUSTOM_CSS_MAX, customCssSchema } from '@/core/validators'
import { apiFetch } from '@/lib/admin-fetch'

export function AdditionalCss() {
  const toast = useToast()
  const [css, setCss] = useState('')

  useEffect(() => {
    apiFetch<Record<string, string>>('/api/admin/settings')
      .then((settings) => setCss(settings.custom_css ?? ''))
      .catch(() => toast.error('Could not load the Additional CSS'))
  }, [toast])
  const [saving, setSaving] = useState(false)

  async function save() {
    const parsed = customCssSchema.safeParse(css)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid CSS')
      return
    }
    setSaving(true)
    await toast.run(
      () =>
        apiFetch('/api/admin/settings', {
          method: 'PUT',
          body: JSON.stringify({ custom_css: parsed.data }),
        }),
      'Additional CSS saved.'
    )
    setSaving(false)
  }

  return (
    <section className="space-y-3 rounded-lg border p-5">
      <div>
        <h2 className="font-semibold">Additional CSS</h2>
        <p className="text-sm text-muted-foreground">
          Applied to the public site after the theme, for every theme. Keep it small: large or
          animated CSS can lower the PageSpeed score.
        </p>
      </div>
      <label htmlFor="custom-css" className="sr-only">
        Additional CSS
      </label>
      <textarea
        id="custom-css"
        value={css}
        onChange={(e) => setCss(e.target.value)}
        rows={12}
        spellCheck={false}
        maxLength={CUSTOM_CSS_MAX}
        placeholder={'.np-site h1 {\n  letter-spacing: -0.02em;\n}'}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {css.length.toLocaleString()} / {CUSTOM_CSS_MAX.toLocaleString()} characters
        </span>
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save CSS'}
        </Button>
      </div>
    </section>
  )
}
