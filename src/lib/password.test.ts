import { hashPassword as hashScrypt } from 'better-auth/crypto'
import { describe, expect, it } from 'vitest'
import { hashPassword, isArgon2id, verifyPassword } from './password'

describe('password hashing', () => {
  it('hashes new passwords with argon2id', async () => {
    const stored = await hashPassword('correct horse')
    expect(isArgon2id(stored)).toBe(true)
    expect(stored).toContain('m=19456,t=2,p=1')
    expect(await verifyPassword({ hash: stored, password: 'correct horse' })).toBe(true)
    expect(await verifyPassword({ hash: stored, password: 'wrong' })).toBe(false)
  })

  it('still verifies legacy scrypt hashes', async () => {
    const legacy = await hashScrypt('legacy pass')
    expect(isArgon2id(legacy)).toBe(false)
    expect(await verifyPassword({ hash: legacy, password: 'legacy pass' })).toBe(true)
    expect(await verifyPassword({ hash: legacy, password: 'nope' })).toBe(false)
  })
})
