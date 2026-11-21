import { describe, expect, it } from 'vitest'
import { parseWxr } from '../importers/wxr'
import { buildWxr } from './wxr'

describe('buildWxr', () => {
  it('round-trips through the WordPress importer', () => {
    const xml = buildWxr({ title: 'Site & Co', url: 'https://example.com', description: '' }, [
      {
        kind: 'post',
        id: 'a1',
        title: 'Hello <World>',
        slug: 'hello-world',
        content: '<p>Body with ]]> inside</p>',
        excerpt: 'Short',
        status: 'published',
        publishedAt: new Date('2026-01-02T03:04:05Z'),
        author: 'Dani',
        terms: [
          { name: 'News', slug: 'news', type: 'category' },
          { name: 'AI', slug: 'ai', type: 'tag' },
        ],
      },
      {
        kind: 'page',
        id: 'b2',
        title: 'About',
        slug: 'about',
        content: '<p>About us</p>',
        excerpt: null,
        status: 'draft',
        publishedAt: null,
        author: null,
        terms: [],
      },
    ])
    const [post, page] = parseWxr(xml)
    expect(post).toMatchObject({
      kind: 'post',
      title: 'Hello <World>',
      slug: 'hello-world',
      content: '<p>Body with ]]> inside</p>',
      status: 'published',
      categories: [{ name: 'News', slug: 'news' }],
      tags: [{ name: 'AI', slug: 'ai' }],
    })
    expect(post?.publishedAt?.toISOString()).toBe('2026-01-02T03:04:05.000Z')
    expect(page).toMatchObject({ kind: 'page', slug: 'about', status: 'draft' })
  })
})
