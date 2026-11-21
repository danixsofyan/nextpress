import { createHash, randomBytes } from 'node:crypto'
import type { Database } from '@/core/db'
import { apiKeys } from '@/core/schema'
import { desc, eq } from 'drizzle-orm'

export const hashApiKey = (key: string) => createHash('sha256').update(key).digest('hex')

export class ApiKeyRepository {
  constructor(private readonly db: Database) {}

  async findMany() {
    return this.db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        prefix: apiKeys.prefix,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
      })
      .from(apiKeys)
      .orderBy(desc(apiKeys.createdAt))
  }

  async create(name: string, userId: string) {
    const key = `np_${randomBytes(32).toString('base64url')}`
    const [row] = await this.db
      .insert(apiKeys)
      .values({ name, userId, prefix: key.slice(0, 10), keyHash: hashApiKey(key) })
      .returning({ id: apiKeys.id, name: apiKeys.name, prefix: apiKeys.prefix })
    return { ...row, key }
  }

  async verify(key: string) {
    const [row] = await this.db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.keyHash, hashApiKey(key)))
      .returning({ id: apiKeys.id })
    return Boolean(row)
  }

  async delete(id: string) {
    await this.db.delete(apiKeys).where(eq(apiKeys.id, id))
  }
}
