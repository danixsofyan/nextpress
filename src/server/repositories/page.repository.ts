import { revalidatePublicSite } from '../revalidate'
import type { Database } from '@/core/db'
import { pages, user } from '@/core/schema'
import type { CreatePageInput, UpdatePageInput } from '@/core/validators'
import { eq, sql } from 'drizzle-orm'
import { sanitizeBlocks, sanitizeContent } from '../sanitize'

export class PageRepository {
  constructor(private readonly db: Database) {}

  async findMany() {
    return this.db
      .select()
      .from(pages)
      .orderBy(sql`${pages.createdAt} desc`)
  }

  async findSummaries() {
    return this.db
      .select({
        id: pages.id,
        title: pages.title,
        slug: pages.slug,
        status: pages.status,
        createdAt: pages.createdAt,
        updatedAt: pages.updatedAt,
        authorId: pages.authorId,
        authorName: user.name,
      })
      .from(pages)
      .leftJoin(user, eq(user.id, pages.authorId))
      .orderBy(sql`${pages.createdAt} desc`)
  }

  async findBySlug(slug: string) {
    const result = await this.db.select().from(pages).where(eq(pages.slug, slug)).limit(1)
    return result[0] ?? null
  }

  async findById(id: string) {
    const result = await this.db.select().from(pages).where(eq(pages.id, id)).limit(1)
    return result[0] ?? null
  }

  async create(input: CreatePageInput, options: { authorId?: string | null } = {}) {
    const result = await this.db
      .insert(pages)
      .values({ ...sanitizeBlocks(sanitizeContent(input)), authorId: options.authorId ?? null })
      .returning()
    revalidatePublicSite()
    return result[0]!
  }

  async update(id: string, input: UpdatePageInput) {
    const result = await this.db
      .update(pages)
      .set({ ...sanitizeBlocks(sanitizeContent(input)), updatedAt: new Date() })
      .where(eq(pages.id, id))
      .returning()
    revalidatePublicSite()
    return result[0] ?? null
  }

  async delete(id: string) {
    const rows = await this.db.delete(pages).where(eq(pages.id, id)).returning({ id: pages.id })
    revalidatePublicSite()
    return rows.length > 0
  }
}
