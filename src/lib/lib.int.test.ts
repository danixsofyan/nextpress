import { afterEach, describe, expect, it, vi } from 'vitest'
import { createUser, unique } from '../../tests/fixtures'
import { CommentRepository, DonationRepository, PostRepository, SettingsRepository } from '@/server'
import { verifyCaptcha } from './captcha'
import { getDashboardStats } from './dashboard'
import { db } from './db'
import { parseWxr } from './importers/wxr'
import { runImport } from './importers/run'
import { getLlmsContent } from './llms'
import { notifyNewComment } from './notifications'
import { getCaptcha, getPluginStates, isPluginActive, savePlugin } from './plugins'
import { erasePersonalData, findPersonalData } from './privacy'
import { runSiteHealth } from './site-health'
import { getSiteSettings } from './site'
import { getActiveTheme, getAppearance, saveAppearance } from './themes'
import { emailTaken, findUser, listUsers, otherAdministrators } from './users'
import { getWidgetAreas } from './widgets'
import { githubStars } from './github'

afterEach(() => vi.unstubAllGlobals())

describe('site settings, themes, and widgets', () => {
  it('reads defaults and saved values', async () => {
    const settings = new SettingsRepository(db)
    await settings.setMany({
      site_title: 'Integration',
      posts_per_page: '7',
      comments_enabled: '0',
    })
    const site = await getSiteSettings()
    expect(site.title).toBe('Integration')
    expect(site.postsPerPage).toBe(7)
    expect(site.commentsEnabled).toBe(false)
    await settings.set('comments_enabled', '1')
    expect(await getWidgetAreas()).toMatchObject({ sidebar: expect.any(Array) })
  })

  it('saves appearance and resolves the active theme', async () => {
    const saved = await saveAppearance({
      active: 'default',
      styles: {
        default: {
          primary: '#16a34a',
          background: '#ffffff',
          foreground: '#0f172a',
          accent: '#f1f5f9',
          font: 'sans',
          radius: 'large',
        },
      },
    })
    expect(saved.active).toBe('default')
    expect((await getAppearance()).themes.length).toBeGreaterThan(1)
    expect((await getActiveTheme()).id).toBe('default')
    await saveAppearance({ styles: { default: null } })
  })
})

describe('plugins and captcha', () => {
  it('validates, activates, and deactivates plugins', async () => {
    expect((await savePlugin('missing', { active: true })).toString()).toBeTruthy()
    expect(await savePlugin('meta-pixel', { active: true })).toMatchObject({ status: 400 })
    expect(await savePlugin('meta-pixel', { config: { pixelId: 'x' } })).toMatchObject({
      status: 400,
    })
    expect(
      await savePlugin('meta-pixel', { config: { pixelId: '1234567890' }, active: true })
    ).toEqual({ ok: true })
    expect(await isPluginActive('meta-pixel')).toBe(true)
    expect(
      await savePlugin('google-recaptcha', { config: { siteKey: '6LcAAAAAAAAAAAAAAAAAAAAAAAA' } })
    ).toEqual({ ok: true })
    expect(await savePlugin('google-recaptcha', { active: true })).toMatchObject({ status: 400 })
    expect((await getPluginStates()).length).toBeGreaterThan(3)
    await savePlugin('meta-pixel', { active: false })
    expect(await getCaptcha()).toBeNull()
    expect(await verifyCaptcha(null)).toBe(true)
  })
})

describe('content helpers', () => {
  it('builds dashboard stats and llms content', async () => {
    const posts = new PostRepository(db)
    await posts.create({
      title: 'Stat',
      slug: `stat-${unique()}`,
      content: '<p>x</p>',
      status: 'published',
    })
    const stats = await getDashboardStats()
    expect(stats.publishedPosts).toBeGreaterThan(0)
    const llms = await getLlmsContent()
    expect(llms.posts.length).toBeGreaterThan(0)
  })

  it('imports a WordPress export', async () => {
    const author = await createUser('administrator')
    const tag = unique()
    const xml = `<?xml version="1.0"?><rss xmlns:wp="http://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"><channel>
      <item><title>Imported ${tag}</title><content:encoded><![CDATA[<p>Body</p>]]></content:encoded><excerpt:encoded></excerpt:encoded><wp:post_name>imported-${tag}</wp:post_name><wp:status>publish</wp:status><wp:post_type>post</wp:post_type><wp:post_date_gmt>2026-01-01 00:00:00</wp:post_date_gmt><category domain="category" nicename="imp-${tag}">Imported</category></item>
      <item><title>Page ${tag}</title><content:encoded><![CDATA[<p>Page</p>]]></content:encoded><wp:post_name>page-${tag}</wp:post_name><wp:status>draft</wp:status><wp:post_type>page</wp:post_type></item>
    </channel></rss>`
    const summary = await runImport(parseWxr(xml), 'keep', author.id)
    expect(summary).toMatchObject({ total: 2, created: 2, failed: 0 })
    const again = await runImport(parseWxr(xml), 'draft', author.id)
    expect(again.skipped).toBe(2)
  })
})

describe('users and privacy', () => {
  it('lists and finds users', async () => {
    const admin = await createUser('administrator')
    expect((await listUsers()).some((u) => u.id === admin.id)).toBe(true)
    expect((await findUser(admin.id))?.email).toBe(admin.email)
    expect(await emailTaken(admin.email)).toBe(true)
    expect(await emailTaken(admin.email, admin.id)).toBe(false)
    expect(await otherAdministrators(admin.id)).toBeGreaterThanOrEqual(0)
  })

  it('finds and erases personal data', async () => {
    const name = `Person ${unique()}`
    const post = await new PostRepository(db).create({
      title: 'p',
      slug: `p-${unique()}`,
      content: '',
      status: 'published',
    })
    await new CommentRepository(db).create(
      { postId: post.id, authorName: name, content: 'hello' },
      'approved'
    )
    await new DonationRepository(db).create({
      orderId: `NPD-${unique()}`,
      amount: 5000,
      donorName: name,
      message: 'hi',
    })
    const found = await findPersonalData({ name: name.toUpperCase() })
    expect(found.comments).toHaveLength(1)
    expect(found.donations).toHaveLength(1)
    expect(await erasePersonalData(name)).toEqual({ comments: 1, donations: 1 })
    expect((await findPersonalData({ name })).comments).toHaveLength(0)
  })
})

describe('health and notifications', () => {
  it('reports site health', async () => {
    const checks = await runSiteHealth()
    expect(checks.find((c) => c.id === 'migrations')?.status).toBe('good')
    expect(checks.find((c) => c.id === 'database')?.status).not.toBe('critical')
  })

  it('skips comment emails without SMTP', async () => {
    await expect(
      notifyNewComment({
        authorName: 'A',
        content: 'x',
        status: 'pending',
        post: { title: 't', slug: 't', authorId: null },
      })
    ).resolves.toBeUndefined()
  })

  it('reads GitHub stars and survives errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ stargazers_count: 42 }))
    )
    expect(await githubStars('a/b')).toBe(42)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 500 }))
    )
    expect(await githubStars('a/b')).toBeNull()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('offline')))
    )
    expect(await githubStars('a/b')).toBeNull()
  })
})
