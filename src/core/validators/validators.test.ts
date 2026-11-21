import { expect, test } from 'vitest'
import { updatePageSchema } from './page'
import { createPostSchema, updatePostSchema } from './post'
import { updateTaxonomySchema } from './taxonomy'

test('create schemas apply defaults', () => {
  expect(createPostSchema.parse({ slug: 'a', title: 'A', content: '' }).status).toBe('draft')
})

test('update schemas never inject defaults into omitted fields', () => {
  expect(updatePostSchema.parse({ title: 'A' })).toEqual({ title: 'A' })
  expect(updatePageSchema.parse({ title: 'A' })).toEqual({ title: 'A' })
  expect(updateTaxonomySchema.parse({ name: 'A' })).toEqual({ name: 'A' })
})

test('cover images accept library paths and https URLs only', () => {
  const ok = ['/media/a1.png', '/uploads/x-y.webp', 'https://cdn.example.com/a.jpg']
  const bad = ['javascript:alert(1)', '//evil.com/a.png', 'http://x.com/a.png', '/a"onerror=1']
  for (const coverImage of ok) expect(updatePostSchema.safeParse({ coverImage }).success).toBe(true)
  for (const coverImage of bad)
    expect(updatePostSchema.safeParse({ coverImage }).success).toBe(false)
})
