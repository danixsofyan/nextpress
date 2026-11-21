import { describe, expect, it } from 'vitest'
import { isPostPublic } from './post.repository'

const base = {
  status: 'published',
  visibility: 'public',
  deletedAt: null,
  publishedAt: new Date(Date.now() - 60_000),
}

describe('isPostPublic', () => {
  it('shows published public posts whose date has passed', () => {
    expect(isPostPublic(base)).toBe(true)
  })

  it('hides drafts, private, trashed, and scheduled posts', () => {
    expect(isPostPublic({ ...base, status: 'draft' })).toBe(false)
    expect(isPostPublic({ ...base, visibility: 'private' })).toBe(false)
    expect(isPostPublic({ ...base, deletedAt: new Date() })).toBe(false)
    expect(isPostPublic({ ...base, publishedAt: new Date(Date.now() + 3_600_000) })).toBe(false)
    expect(isPostPublic({ ...base, publishedAt: null })).toBe(false)
  })
})
