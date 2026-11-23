import { describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { registerThemeTools } from '@/lib/themes'
import { handleMcpRequest } from './http'

const key = process.env.NEXTPRESS_API_KEY!
const unique = () => Math.random().toString(36).slice(2, 10)
let nextId = 1

async function rpc(method: string, params: unknown, apiKey = key) {
  const res = await handleMcpRequest(
    db,
    new Request('https://example.test/api/mcp', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, params }),
    }),
    registerThemeTools
  )
  return { status: res.status, body: res.status === 200 ? await res.json() : null }
}

async function tool(name: string, args: Record<string, unknown> = {}) {
  const { body } = await rpc('tools/call', { name, arguments: args })
  const result = body.result as { content: { text: string }[]; isError?: boolean }
  const text = result.content[0]?.text ?? ''
  let data: unknown = text
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { error: Boolean(result.isError), data: data as Record<string, unknown> }
}

describe('MCP server', () => {
  it('requires an API key and lists every tool', async () => {
    expect((await rpc('tools/list', {}, 'wrong-key')).status).toBe(401)
    const { body } = await rpc('tools/list', {})
    expect(body.result.tools).toHaveLength(22)
  })

  it('serves the guides and specs', async () => {
    for (const name of [
      'get_writing_guide',
      'get_block_spec',
      'get_theme_spec',
      'get_site_config',
      'list_themes',
      'get_widgets',
    ]) {
      expect((await tool(name)).error).toBe(false)
    }
  })

  it('writes posts and taxonomies', async () => {
    const slug = `mcp-${unique()}`
    const created = await tool('create_post', { title: 'From MCP', slug, content: '<p>hi</p>' })
    expect(created.error).toBe(false)
    const post = (await tool('get_post', { slug })).data as { id: string; title: string }
    expect(post.title).toBe('From MCP')
    expect((await tool('update_post', { id: post.id, title: 'Edited by MCP' })).error).toBe(false)
    expect((await tool('list_posts', { limit: 5 })).error).toBe(false)
    expect(
      (await tool('create_taxonomy', { name: 'MCP tag', slug: `mcp-tag-${unique()}` })).error
    ).toBe(false)
  })

  it('builds pages, the homepage, navigation, widgets, identity, and themes', async () => {
    const slug = `mcp-page-${unique()}`
    const created = await tool('create_page', {
      title: 'Landing',
      slug,
      status: 'published',
      blocks: [{ type: 'hero', heading: 'Hello' }],
    })
    expect(created.error).toBe(false)
    const page = (await tool('get_page', { slug })).data as { id: string }
    expect((await tool('list_pages')).error).toBe(false)
    expect((await tool('update_page', { id: page.id, title: 'Landing v2' })).error).toBe(false)
    expect((await tool('set_homepage', { show: 'page', pageId: page.id })).error).toBe(false)
    expect((await tool('set_homepage', { show: 'posts' })).error).toBe(false)
    expect(
      (
        await tool('set_navigation', {
          items: [
            { label: 'Docs', href: '/docs', children: [{ label: 'API', href: '/api/docs' }] },
          ],
        })
      ).error
    ).toBe(false)
    expect(
      (await tool('set_navigation', { items: [{ label: 'x', href: 'javascript:alert(1)' }] })).error
    ).toBe(true)
    expect(
      (
        await tool('set_widgets', {
          sidebar: [{ type: 'search' }],
          footer: [{ type: 'text', text: 'Hi' }],
        })
      ).error
    ).toBe(false)
    expect(
      (await tool('update_site_identity', { siteTitle: 'MCP Site', tagline: 'Built by tools' }))
        .error
    ).toBe(false)
    expect(
      (await tool('update_theme_style', { theme: 'default', style: { primary: '#16a34a' } })).error
    ).toBe(false)
    expect((await tool('update_theme_style', { theme: 'default', reset: true })).error).toBe(false)
    expect((await tool('set_theme', { theme: 'editorial' })).error).toBe(false)
    expect((await tool('set_theme', { theme: 'default' })).error).toBe(false)
    expect((await tool('delete_page', { id: page.id })).error).toBe(false)
    expect((await tool('delete_page', { id: page.id })).error).toBe(true)
  })
})
