import { hash, verify } from '@node-rs/argon2'
import { verifyPassword as verifyScrypt } from 'better-auth/crypto'

const ARGON2ID = {
  algorithm: 2,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const

export const isArgon2id = (stored: string) => stored.startsWith('$argon2id$')

export const hashPassword = (password: string) => hash(password, ARGON2ID)

export const verifyPassword = ({ hash: stored, password }: { hash: string; password: string }) =>
  isArgon2id(stored) ? verify(stored, password) : verifyScrypt({ hash: stored, password })
