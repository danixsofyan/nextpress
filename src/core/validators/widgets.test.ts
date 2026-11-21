import { describe, expect, it } from 'vitest'
import { widgetAreasSchema } from './widgets'

describe('widget areas', () => {
  it('accepts every widget type', () => {
    const result = widgetAreasSchema.safeParse({
      sidebar: [
        { type: 'search' },
        { type: 'recentPosts', title: 'Recent', count: 5 },
        { type: 'categories', showCounts: true },
        { type: 'tags' },
      ],
      footer: [
        { type: 'text', title: 'About', text: 'Hello' },
        { type: 'links', links: [{ label: 'GitHub', href: 'https://github.com' }] },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects unsafe links, empty text, and too many posts', () => {
    const bad = [
      { type: 'links', links: [{ label: 'x', href: 'javascript:alert(1)' }] },
      { type: 'text', text: '   ' },
      { type: 'recentPosts', count: 50 },
    ]
    for (const widget of bad) {
      expect(widgetAreasSchema.safeParse({ sidebar: [widget], footer: [] }).success).toBe(false)
    }
  })
})
