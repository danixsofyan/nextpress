import type { Database } from '@/core/db'
import { audit } from '../audit'
import { media } from '@/core/schema'
import { eq, sql } from 'drizzle-orm'

export class MediaRepository {
  constructor(private readonly db: Database) {}

  async findMany() {
    return this.db
      .select()
      .from(media)
      .orderBy(sql`${media.createdAt} desc`)
  }

  async findById(id: string) {
    const result = await this.db.select().from(media).where(eq(media.id, id)).limit(1)
    return result[0] ?? null
  }

  async create(input: {
    filename: string
    url: string
    mimeType: string
    size: number
    alt?: string
  }) {
    const result = await this.db.insert(media).values(input).returning()
    const row = result[0]!
    await audit(this.db, 'media.upload', { type: 'media', id: row.id }, { after: row })
    return row
  }

  async update(id: string, input: { alt?: string }) {
    const result = await this.db.update(media).set(input).where(eq(media.id, id)).returning()
    return result[0] ?? null
  }

  async delete(id: string) {
    const rows = await this.db.delete(media).where(eq(media.id, id)).returning()
    if (rows[0]) await audit(this.db, 'media.delete', { type: 'media', id }, { before: rows[0] })
  }
}
