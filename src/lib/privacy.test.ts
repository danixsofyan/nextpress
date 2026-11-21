import { describe, expect, it, vi } from 'vitest'

vi.mock('./db', () => ({ db: {} }))
vi.mock('@/server/audit', () => ({ audit: vi.fn() }))

const { privacyQuerySchema } = await import('./privacy')

describe('privacyQuerySchema', () => {
  it('needs a name or an email', () => {
    expect(privacyQuerySchema.safeParse({}).success).toBe(false)
    expect(privacyQuerySchema.safeParse({ name: 'Ani' }).success).toBe(true)
    expect(privacyQuerySchema.safeParse({ email: 'ani@example.com' }).success).toBe(true)
    expect(privacyQuerySchema.safeParse({ email: 'not-an-email' }).success).toBe(false)
  })
})
