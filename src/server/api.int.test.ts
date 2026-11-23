import { describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { createApp } from './app'

const app = createApp(db)
const key = process.env.NEXTPRESS_API_KEY!
const unique = () => Math.random().toString(36).slice(2, 10)

const call = (path: string, init: RequestInit & { json?: unknown } = {}) =>
  app.request(path, {
    ...init,
    headers: { 'X-Api-Key': key, 'Content-Type': 'application/json', ...init.headers },
    ...(init.json !== undefined && { body: JSON.stringify(init.json) }),
  })

describe('REST API', () => {
  it('reports health and serves the OpenAPI document', async () => {
    expect((await (await app.request('/api/health')).json()).status).toBe('ok')
    const spec = await (await app.request('/api/openapi.json')).json()
    expect(Object.keys(spec.paths)).toContain('/api/posts')
  })

  it('rejects missing keys and invalid input with stable error codes', async () => {
    const denied = await app.request('/api/posts')
    expect(denied.status).toBe(401)
    const invalid = await call('/api/posts', { method: 'POST', json: { title: '' } })
    expect(invalid.status).toBe(400)
    expect((await invalid.json()).code).toBe('NP-4000')
    expect((await call('/api/posts/00000000-0000-0000-0000-000000000000')).status).toBe(404)
  })

  it('manages a post through its whole life', async () => {
    const slug = `api-${unique()}`
    const created = await call('/api/posts', {
      method: 'POST',
      json: { title: 'API post', slug, content: '<p>x</p>', status: 'published' },
    })
    expect(created.status).toBe(201)
    expect(created.headers.get('X-RateLimit-Limit')).toBeTruthy()
    const { id } = await created.json()
    expect((await call(`/api/posts?status=published&limit=100`)).status).toBe(200)
    expect((await (await call(`/api/posts/${id}`)).json()).slug).toBe(slug)
    const updated = await call(`/api/posts/${id}`, { method: 'PUT', json: { title: 'Renamed' } })
    expect((await updated.json()).title).toBe('Renamed')
    const duplicate = await call('/api/posts', {
      method: 'POST',
      json: { title: 'Dup', slug, content: '', status: 'draft' },
    })
    expect(duplicate.status).toBe(409)
    expect((await call(`/api/posts/${id}`, { method: 'DELETE' })).status).toBe(204)
    expect((await call(`/api/posts/${id}?permanent=true`, { method: 'DELETE' })).status).toBe(204)
    expect((await call(`/api/posts/${id}?permanent=true`, { method: 'DELETE' })).status).toBe(404)
  })

  it('manages pages and taxonomies', async () => {
    const page = await call('/api/pages', {
      method: 'POST',
      json: {
        title: 'API page',
        slug: `page-${unique()}`,
        status: 'published',
        blocks: [{ type: 'hero', heading: 'Hi' }],
      },
    })
    expect(page.status).toBe(201)
    const { id } = await page.json()
    expect((await call('/api/pages')).status).toBe(200)
    expect((await call(`/api/pages/${id}`)).status).toBe(200)
    expect(
      (await call(`/api/pages/${id}`, { method: 'PUT', json: { title: 'Edited' } })).status
    ).toBe(200)
    expect((await call(`/api/pages/${id}`, { method: 'DELETE' })).status).toBe(204)
    expect((await call(`/api/pages/${id}?permanent=true`, { method: 'DELETE' })).status).toBe(204)

    const tax = await call('/api/taxonomies', {
      method: 'POST',
      json: { name: 'News', slug: `news-${unique()}`, type: 'category' },
    })
    expect(tax.status).toBe(201)
    const taxonomy = await tax.json()
    expect((await call('/api/taxonomies?type=category')).status).toBe(200)
    expect(
      (await call(`/api/taxonomies/${taxonomy.id}`, { method: 'PUT', json: { name: 'Updates' } }))
        .status
    ).toBe(200)
    expect((await call(`/api/taxonomies/${taxonomy.id}`, { method: 'DELETE' })).status).toBe(204)
  })
})
