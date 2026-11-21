'use client'

import { formatDate } from '@/themes/engine'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiKeysPanel } from '@/components/admin/api-keys-panel'
import { DashboardLayout } from '@/components/admin/dashboard-layout'
import { ImageField } from '@/components/admin/image-field'
import { Tabs } from '@/components/admin/tabs'
import { useToast } from '@/components/admin/toast'

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'reading', label: 'Reading' },
  { key: 'branding', label: 'Branding' },
  { key: 'seo', label: 'SEO' },
  { key: 'privacy', label: 'Privacy' },
  { key: 'api', label: 'API' },
] as const
type Tab = (typeof TABS)[number]['key']
const isTab = (value: string | null): value is Tab => TABS.some((t) => t.key === value)

const DATE_FORMATS = ['F j, Y', 'Y-m-d', 'm/d/Y', 'd/m/Y', 'd.m.Y']
const TIME_FORMATS = ['g:i a', 'g:i A', 'H:i']

type Settings = Record<string, string>
type PageOption = { id: string; title: string; slug: string; status: string }

const textarea =
  'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
const select =
  'mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const PRIVACY_TEMPLATE = `<h2>Who we are</h2><p>Describe your site and how visitors can contact you.</p>
<h2>What personal data we collect and why</h2><p>Explain what data you collect (for example contact form submissions or analytics) and the reason.</p>
<h2>Cookies</h2><p>Visitors do not receive cookies. Administrators receive a session cookie when they sign in, which is removed when they sign out or after seven days.</p>
<h2>Analytics</h2><p>If analytics are enabled, describe the provider and the data it collects.</p>
<h2>Who we share your data with</h2><p>List any third parties that receive personal data.</p>
<h2>How long we retain your data</h2><p>State how long each kind of data is kept.</p>
<h2>What rights you have over your data</h2><p>Explain how visitors can request access to, export, or erasure of their data.</p>`

function FormatChoice({
  name,
  formats,
  value,
  onChange,
  timeZone,
  now,
}: {
  name: string
  formats: string[]
  value: string
  onChange: (v: string) => void
  timeZone: string
  now: Date | null
}) {
  const isCustom = !formats.includes(value)
  return (
    <fieldset className="space-y-2">
      {formats.map((f) => (
        <label key={f} className="flex items-center gap-3 text-sm">
          <input type="radio" name={name} checked={value === f} onChange={() => onChange(f)} />
          <span className="w-44">{now ? formatDate(now, f, timeZone) : '\u00a0'}</span>
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{f}</code>
        </label>
      ))}
      <label className="flex items-center gap-3 text-sm">
        <input type="radio" name={name} checked={isCustom} onChange={() => onChange('')} />
        <span>Custom:</span>
        <Input
          value={isCustom ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-32 font-mono text-xs"
          aria-label={`Custom ${name}`}
        />
      </label>
      <p className="text-xs text-muted-foreground">
        Preview:{' '}
        <strong>{now ? formatDate(now, value || (formats[0] as string), timeZone) : ''}</strong>
      </p>
    </fieldset>
  )
}

export function SettingsClient({
  initialSettings,
  initialPages,
}: {
  initialSettings: Settings
  initialPages: PageOption[]
}) {
  const [tab, setTabState] = useState<Tab>('general')
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [pages, setPages] = useState<PageOption[]>(initialPages)
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const [privacyChoice, setPrivacyChoice] = useState(initialSettings.privacy_policy_page ?? '')
  const [now, setNow] = useState<Date | null>(null)

  const loadPages = useCallback(async () => {
    const res = await fetch('/api/admin/pages')
    if (res.ok) setPages(await res.json())
  }, [])

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('tab')
    if (isTab(fromUrl)) setTabState(fromUrl)
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeZones = useMemo(() => ['UTC', ...Intl.supportedValuesOf('timeZone')], [])
  const timeZone = settings.timezone || 'UTC'
  const publishedPages = pages.filter((p) => p.status === 'published')
  const privacyPage = pages.find((p) => p.id === settings.privacy_policy_page)

  function setTab(next: Tab) {
    setTabState(next)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', next)
    window.history.replaceState(null, '', url)
  }

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function save(values: Settings) {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      toast.error(body.error ?? 'Could not save settings')
      return false
    }
    setSettings(await res.json())
    toast.success('Settings saved.')
    return true
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await save(settings)
  }

  async function createPrivacyPage() {
    const slug = pages.some((p) => p.slug === 'privacy-policy')
      ? `privacy-policy-${Date.now().toString(36)}`
      : 'privacy-policy'
    const res = await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Privacy Policy',
        slug,
        content: PRIVACY_TEMPLATE,
        status: 'draft',
      }),
    })
    if (!res.ok) {
      toast.error('Could not create the page')
      return
    }
    const page = await res.json()
    await loadPages()
    setPrivacyChoice(page.id)
    if (await save({ privacy_policy_page: page.id })) {
      window.location.href = `/admin/pages/${page.id}`
    }
  }

  const saveBar = (
    <div className="flex items-center gap-3">
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  )

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs tabs={TABS} value={tab} onChange={setTab} label="Settings sections" />

      {tab === 'general' && (
        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          <div>
            <Label htmlFor="site_title">Site Title</Label>
            <Input
              id="site_title"
              value={settings.site_title ?? ''}
              onChange={(e) => set('site_title', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="site_tagline">Tagline</Label>
            <Input
              id="site_tagline"
              value={settings.site_tagline ?? ''}
              onChange={(e) => set('site_tagline', e.target.value)}
              className="mt-1"
              placeholder="Just another NextPress site"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              In a few words, explain what this site is about.
            </p>
          </div>
          <div>
            <Label>Site Address (URL)</Label>
            <p className="mt-1 rounded-md bg-muted px-3 py-2 font-mono text-sm">
              {process.env.NEXT_PUBLIC_SITE_URL}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set by the NEXT_PUBLIC_SITE_URL environment variable.
            </p>
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={timeZone}
              onChange={(e) => set('timezone', e.target.value)}
              className={select}
            >
              {timeZones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            {now && (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p>
                  Universal time is{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">
                    {formatDate(now, 'Y-m-d H:i:s', 'UTC')}
                  </code>
                </p>
                <p>
                  Local time is{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5">
                    {formatDate(now, 'Y-m-d H:i:s', timeZone)}
                  </code>{' '}
                  ({formatDate(now, 'T', timeZone)})
                </p>
              </div>
            )}
          </div>
          <div>
            <Label>Date Format</Label>
            <div className="mt-2">
              <FormatChoice
                name="date_format"
                formats={DATE_FORMATS}
                value={settings.date_format ?? 'F j, Y'}
                onChange={(v) => set('date_format', v)}
                timeZone={timeZone}
                now={now}
              />
            </div>
          </div>
          <div>
            <Label>Time Format</Label>
            <div className="mt-2">
              <FormatChoice
                name="time_format"
                formats={TIME_FORMATS}
                value={settings.time_format ?? 'g:i a'}
                onChange={(v) => set('time_format', v)}
                timeZone={timeZone}
                now={now}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Uses the same format characters as WordPress, e.g. <code>F j, Y</code> or{' '}
              <code>H:i</code>. Escape a literal character with <code>\</code>.
            </p>
          </div>
          {saveBar}
        </form>
      )}

      {tab === 'reading' && (
        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Your homepage displays</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="show_on_front"
                checked={settings.show_on_front !== 'page'}
                onChange={() => set('show_on_front', 'posts')}
              />
              Your latest posts
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="show_on_front"
                checked={settings.show_on_front === 'page'}
                onChange={() => set('show_on_front', 'page')}
              />
              A static page
            </label>
            {settings.show_on_front === 'page' && (
              <div className="pl-6">
                <Label htmlFor="page_on_front">Homepage</Label>
                <select
                  id="page_on_front"
                  value={settings.page_on_front ?? ''}
                  onChange={(e) => set('page_on_front', e.target.value)}
                  className={select}
                >
                  <option value="">— Select —</option>
                  {publishedPages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Only published pages are listed. Posts stay available at /blog.
                </p>
              </div>
            )}
          </fieldset>
          <div>
            <Label htmlFor="posts_per_page">Blog pages show at most</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                id="posts_per_page"
                type="number"
                min="1"
                max="100"
                value={settings.posts_per_page ?? '10'}
                onChange={(e) => set('posts_per_page', e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">posts</span>
            </div>
          </div>
          <div>
            <Label htmlFor="posts_per_rss">Syndication feeds show the most recent</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                id="posts_per_rss"
                type="number"
                min="1"
                max="100"
                value={settings.posts_per_rss ?? '10'}
                onChange={(e) => set('posts_per_rss', e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">items</span>
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">For each post in a feed, include</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="rss_use_excerpt"
                checked={settings.rss_use_excerpt !== '1'}
                onChange={() => set('rss_use_excerpt', '0')}
              />
              Full text
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="rss_use_excerpt"
                checked={settings.rss_use_excerpt === '1'}
                onChange={() => set('rss_use_excerpt', '1')}
              />
              Excerpt
            </label>
            <p className="text-xs text-muted-foreground">
              Your feed is at{' '}
              <a href="/feed.xml" target="_blank" rel="noreferrer" className="underline">
                /feed.xml
              </a>
              .
            </p>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Search engine visibility</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.blog_public === '0'}
                onChange={(e) => set('blog_public', e.target.checked ? '0' : '1')}
              />
              Discourage search engines from indexing this site
            </label>
            <p className="text-xs text-muted-foreground">
              It is up to search engines to honor this request.
            </p>
          </fieldset>
          {saveBar}
        </form>
      )}

      {tab === 'branding' && (
        <form onSubmit={handleSave} className="max-w-2xl space-y-8">
          <ImageField
            id="site_logo"
            label="Logo"
            hint="Shown in the site header instead of the site title. A transparent PNG about 200×40 px works well."
            value={settings.site_logo ?? ''}
            onChange={(v) => set('site_logo', v)}
            previewClassName="h-16 w-40"
          />
          <ImageField
            id="site_icon"
            label="Site Icon (favicon)"
            hint="Shown in browser tabs and bookmarks. Use a square image of at least 512×512 px."
            value={settings.site_icon ?? ''}
            onChange={(v) => set('site_icon', v)}
          />
          <ImageField
            id="og_image"
            label="Default social image (Open Graph)"
            hint="Used when a page is shared on social media and has no image of its own. Recommended size: 1200×630 px."
            value={settings.og_image ?? ''}
            onChange={(v) => set('og_image', v)}
            previewClassName="h-[63px] w-[120px]"
          />
          {saveBar}
        </form>
      )}

      {tab === 'seo' && (
        <form onSubmit={handleSave} className="max-w-2xl space-y-6">
          <div>
            <Label htmlFor="default_meta_description">Default Meta Description</Label>
            <textarea
              id="default_meta_description"
              value={settings.default_meta_description ?? ''}
              onChange={(e) => set('default_meta_description', e.target.value)}
              rows={3}
              maxLength={160}
              className={textarea}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Used on pages without their own description. Falls back to the tagline.
            </p>
          </div>
          <div>
            <Label htmlFor="ga_id">Google Analytics 4 Measurement ID</Label>
            <Input
              id="ga_id"
              value={settings.ga_id ?? ''}
              onChange={(e) => set('ga_id', e.target.value.trim())}
              placeholder="G-XXXXXXXXXX"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Loaded on the public site only, never in the admin.
            </p>
          </div>
          <div>
            <Label htmlFor="robots_txt">Custom robots.txt</Label>
            <textarea
              id="robots_txt"
              value={settings.robots_txt ?? ''}
              onChange={(e) => set('robots_txt', e.target.value)}
              rows={6}
              className={`${textarea} font-mono`}
              placeholder={'User-agent: *\nAllow: /'}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave empty to use the default. A Sitemap line is added automatically.
            </p>
          </div>
          {saveBar}
        </form>
      )}

      {tab === 'privacy' && (
        <div className="max-w-2xl space-y-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              As a website owner, you may need to follow national or international privacy laws. For
              example, you may need to create and display a privacy policy.
            </p>
            <p>
              The new page includes headings to help you write your policy. It is your
              responsibility to complete it accurately and keep it current.
            </p>
            {privacyPage && (
              <p className="text-foreground">
                <a href={`/admin/pages/${privacyPage.id}`} className="font-medium underline">
                  Edit
                </a>{' '}
                or{' '}
                <a
                  href={`/${privacyPage.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline"
                >
                  view
                </a>{' '}
                your Privacy Policy page.
                {privacyPage.status !== 'published' &&
                  ' It is still a draft: publish it to show it in the site footer.'}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
            <span className="text-sm font-medium">Create a new Privacy Policy page</span>
            <Button type="button" variant="outline" onClick={createPrivacyPage} disabled={saving}>
              Create
            </Button>
          </div>
          <div className="space-y-2 rounded-xl border border-border p-4">
            <Label htmlFor="privacy_policy_page">Change your Privacy Policy page</Label>
            <div className="flex gap-2">
              <select
                id="privacy_policy_page"
                value={privacyChoice}
                onChange={(e) => setPrivacyChoice(e.target.value)}
                className={select}
              >
                <option value="">— Select —</option>
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                    {p.status !== 'published' ? ' (draft)' : ''}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                className="mt-1"
                disabled={saving}
                onClick={() => save({ privacy_policy_page: privacyChoice })}
              >
                Use This Page
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The published Privacy Policy page is linked in the site footer.
            </p>
          </div>
        </div>
      )}

      {tab === 'api' && (
        <div className="max-w-3xl space-y-4">
          <ApiKeysPanel />
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">API Endpoint</h3>
            <div className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
              {process.env.NEXT_PUBLIC_SITE_URL}/api
            </div>
            <p className="text-xs text-muted-foreground">
              REST API base URL. Interactive reference at{' '}
              <a href="/api/docs" target="_blank" rel="noreferrer" className="underline">
                /api/docs
              </a>
              .
            </p>
          </div>
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">MCP Server</h3>
            <div className="rounded-md bg-muted px-3 py-2 font-mono text-sm">
              {process.env.NEXT_PUBLIC_SITE_URL}/api/mcp
            </div>
            <p className="text-xs text-muted-foreground">
              Streamable HTTP endpoint for AI agents (Claude, ChatGPT, Cursor). Send your key in the{' '}
              <code>X-Api-Key</code> header.
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
