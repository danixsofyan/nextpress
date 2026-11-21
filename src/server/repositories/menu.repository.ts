import { revalidatePublicSite } from '../revalidate'
import { audit } from '../audit'
import type { Database } from '@/core/db'
import { menus } from '@/core/schema'
import { eq } from 'drizzle-orm'

export class MenuRepository {
  constructor(private readonly db: Database) {}

  async findMany() {
    return this.db.select().from(menus)
  }

  async findById(id: string) {
    const result = await this.db.select().from(menus).where(eq(menus.id, id)).limit(1)
    return result[0] ?? null
  }

  async findBySlug(slug: string) {
    const result = await this.db.select().from(menus).where(eq(menus.slug, slug)).limit(1)
    return result[0] ?? null
  }

  async create(input: { name: string; slug: string; items?: string }) {
    const result = await this.db
      .insert(menus)
      .values({ name: input.name, slug: input.slug, items: input.items ?? '[]' })
      .returning()
    const row = result[0]!
    await audit(this.db, 'menu.create', { type: 'menu', id: row.id }, { after: row })
    revalidatePublicSite()
    return row
  }

  async update(id: string, input: { name?: string; slug?: string; items?: string }) {
    const result = await this.db
      .update(menus)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(menus.id, id))
      .returning()
    if (result[0]) await audit(this.db, 'menu.update', { type: 'menu', id }, { after: result[0] })
    revalidatePublicSite()
    return result[0] ?? null
  }

  async delete(id: string) {
    const rows = await this.db.delete(menus).where(eq(menus.id, id)).returning()
    if (rows[0]) await audit(this.db, 'menu.delete', { type: 'menu', id }, { before: rows[0] })
    revalidatePublicSite()
  }
}
