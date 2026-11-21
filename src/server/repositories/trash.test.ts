import { expect, test } from 'vitest'
import { restoredSlug, trashedSlug } from './trash'

test('trashing frees the slug and restoring brings it back', () => {
  const slug = trashedSlug('hello-world', '3c80cc05-c155-4ee0-a718-a1a69386d26f')
  expect(slug).toBe('hello-world__trashed-3c80cc05')
  expect(restoredSlug(slug)).toBe('hello-world')
  expect(restoredSlug('plain-slug')).toBe('plain-slug')
})
