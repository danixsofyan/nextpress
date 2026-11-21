import { describe, expect, it } from 'vitest'
import { createCommentSchema } from './comment'

const postId = '2adb87a4-5bee-4d8a-8f08-a02c86f14c21'

describe('createCommentSchema', () => {
  it('trims and strips control characters', () => {
    const parsed = createCommentSchema.parse({
      postId,
      authorName: '  Ani\u0000 ',
      content: ' Halo\u0007 dunia ',
    })
    expect(parsed).toEqual({ postId, authorName: 'Ani', content: 'Halo dunia' })
  })

  it('rejects empty, oversized, or unlinked comments', () => {
    expect(createCommentSchema.safeParse({ postId, authorName: ' ', content: 'x' }).success).toBe(
      false
    )
    expect(
      createCommentSchema.safeParse({ postId, authorName: 'A', content: 'x'.repeat(2001) }).success
    ).toBe(false)
    expect(
      createCommentSchema.safeParse({ postId: 'nope', authorName: 'A', content: 'x' }).success
    ).toBe(false)
  })
})
