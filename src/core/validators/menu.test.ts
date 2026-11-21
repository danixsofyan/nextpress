import { describe, expect, it } from 'vitest'
import { menuItemsJson, menuToNavigation } from './menu'

const items = [
  { id: '1', label: 'Blog', url: '/blog' },
  { id: '2', label: 'Docs', url: '/docs' },
  { id: '3', label: 'API', url: '/api/docs', parentId: '2' },
]

describe('menu items', () => {
  it('builds a one-level navigation tree', () => {
    expect(menuToNavigation(JSON.stringify(items))).toEqual([
      { label: 'Blog', href: '/blog' },
      { label: 'Docs', href: '/docs', children: [{ label: 'API', href: '/api/docs' }] },
    ])
  })

  it('rejects unsafe links and orphaned submenu items', () => {
    const bad = [
      [{ id: '1', label: 'x', url: 'javascript:alert(1)' }],
      [{ id: '1', label: 'x', url: '/a', parentId: 'missing' }],
      [
        { id: '1', label: 'a', url: '/a' },
        { id: '2', label: 'b', url: '/b', parentId: '1' },
        { id: '3', label: 'c', url: '/c', parentId: '2' },
      ],
    ]
    for (const list of bad)
      expect(menuItemsJson.safeParse(JSON.stringify(list)).success).toBe(false)
    expect(menuToNavigation(JSON.stringify(bad[0]))).toEqual([])
  })
})
