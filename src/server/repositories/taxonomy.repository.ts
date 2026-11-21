import type { Database } from '@/core/db'
import { taxonomies, termRelationships } from '@/core/schema'
import type { CreateTaxonomyInput, UpdateTaxonomyInput } from '@/core/validators'
import { asc, count, eq } from 'drizzle-orm'

export class TaxonomyRepository {
  constructor(private readonly db: Database) {}

  async findMany(type?: 'category' | 'tag' | 'custom') {
    if (type) {
      return this.db.select().from(taxonomies).where(eq(taxonomies.type, type))
    }
    return this.db.select().from(taxonomies)
  }

  async findManyWithCounts(type?: 'category' | 'tag' | 'custom') {
    return this.db
      .select({
        id: taxonomies.id,
        name: taxonomies.name,
        slug: taxonomies.slug,
        type: taxonomies.type,
        description: taxonomies.description,
        createdAt: taxonomies.createdAt,
        count: count(termRelationships.postId),
      })
      .from(taxonomies)
      .leftJoin(termRelationships, eq(termRelationships.taxonomyId, taxonomies.id))
      .where(type ? eq(taxonomies.type, type) : undefined)
      .groupBy(taxonomies.id)
      .orderBy(asc(taxonomies.name))
  }

  async findBySlug(slug: string) {
    const result = await this.db.select().from(taxonomies).where(eq(taxonomies.slug, slug)).limit(1)
    return result[0] ?? null
  }

  async findById(id: string) {
    const result = await this.db.select().from(taxonomies).where(eq(taxonomies.id, id)).limit(1)
    return result[0] ?? null
  }

  async create(input: CreateTaxonomyInput) {
    const result = await this.db.insert(taxonomies).values(input).returning()
    return result[0]!
  }

  async update(id: string, input: UpdateTaxonomyInput) {
    const result = await this.db
      .update(taxonomies)
      .set(input)
      .where(eq(taxonomies.id, id))
      .returning()
    return result[0] ?? null
  }

  async delete(id: string) {
    const rows = await this.db
      .delete(taxonomies)
      .where(eq(taxonomies.id, id))
      .returning({ id: taxonomies.id })
    return rows.length > 0
  }
}
