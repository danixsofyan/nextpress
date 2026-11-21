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
