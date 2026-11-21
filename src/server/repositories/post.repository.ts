import { revalidatePublicSite } from '../revalidate'
import type { Database } from '@/core/db'
import { posts, termRelationships, user } from '@/core/schema'
import type { CreatePostInput, UpdatePostInput, ListPostsInput } from '@/core/validators'
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm'
import { audit } from '../audit'
import { restoredSlug, trashedSlug } from './trash'
import { sanitizeContent } from '../sanitize'

export class PostRepository {
  constructor(private readonly db: Database) {}

  async findMany(input: ListPostsInput) {
    const conditions = [
      isNull(posts.deletedAt),
      ...(input.status ? [eq(posts.status, input.status)] : []),
    ]
    return this.db
      .select()
      .from(posts)
      .where(and(...conditions))
      .limit(input.limit)
      .offset(input.offset)
      .orderBy(sql`${posts.createdAt} desc`)
  }

  async findAllSummaries({ trashed = false }: { trashed?: boolean } = {}) {
    return this.db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        status: posts.status,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        publishedAt: posts.publishedAt,
        authorId: posts.authorId,
        authorName: user.name,
        deletedAt: posts.deletedAt,
      })
      .from(posts)
      .leftJoin(user, eq(user.id, posts.authorId))
      .where(trashed ? isNotNull(posts.deletedAt) : isNull(posts.deletedAt))
      .orderBy(sql`${posts.createdAt} desc`)
  }

  async findBySlug(slug: string) {
    const result = await this.db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, slug), isNull(posts.deletedAt)))
      .limit(1)
    return result[0] ?? null
  }

  async findById(id: string, { includeTrashed = false }: { includeTrashed?: boolean } = {}) {
    const result = await this.db
      .select()
      .from(posts)
      .where(includeTrashed ? eq(posts.id, id) : and(eq(posts.id, id), isNull(posts.deletedAt)))
      .limit(1)
    return result[0] ?? null
  }

  async create(
    input: CreatePostInput,
    options: { publishedAt?: Date | null; authorId?: string | null } = {}
  ) {
    const { taxonomyIds, ...data } = sanitizeContent(input)
    const publishedAt = input.status === 'published' ? (options.publishedAt ?? new Date()) : null
    const result = await this.db
      .insert(posts)
      .values({ ...data, publishedAt, authorId: options.authorId ?? null })
      .returning()
    const post = result[0]!
    if (taxonomyIds?.length) {
      await this.db
        .insert(termRelationships)
        .values(taxonomyIds.map((taxonomyId) => ({ postId: post.id, taxonomyId })))
    }
    await audit(this.db, 'post.create', { type: 'post', id: post.id }, { after: post })
    revalidatePublicSite()
    return post
  }

  async update(id: string, input: UpdatePostInput) {
    const before = await this.findById(id)
    if (!before) return null
    const { taxonomyIds, ...data } = sanitizeContent(input)
    const result = await this.db
      .update(posts)
      .set({
        ...data,
        updatedAt: new Date(),
        ...(data.status === 'published' && {
          publishedAt: sql`coalesce(${posts.publishedAt}, now())`,
        }),
      })
      .where(and(eq(posts.id, id), isNull(posts.deletedAt)))
      .returning()
    if (taxonomyIds !== undefined) {
      await this.db.delete(termRelationships).where(eq(termRelationships.postId, id))
      if (taxonomyIds.length) {
        await this.db
          .insert(termRelationships)
          .values(taxonomyIds.map((taxonomyId) => ({ postId: id, taxonomyId })))
      }
    }
    const after = result[0] ?? null
    const action =
      before.status !== 'published' && after?.status === 'published'
        ? 'post.publish'
        : 'post.update'
    await audit(this.db, action, { type: 'post', id }, { before, after })
    revalidatePublicSite()
    return after
  }

  async delete(id: string) {
    const before = await this.findById(id)
    if (!before) return false
    await this.db
      .update(posts)
      .set({ deletedAt: new Date(), slug: trashedSlug(before.slug, id) })
      .where(eq(posts.id, id))
    await audit(this.db, 'post.trash', { type: 'post', id }, { before })
    revalidatePublicSite()
    return true
  }

  async restore(id: string) {
    const before = await this.findById(id, { includeTrashed: true })
    if (!before?.deletedAt) return null
    const [after] = await this.db
      .update(posts)
      .set({ deletedAt: null, slug: restoredSlug(before.slug), updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning()
    await audit(this.db, 'post.restore', { type: 'post', id }, { before, after })
    revalidatePublicSite()
    return after ?? null
  }

  async purge(id: string) {
    const before = await this.findById(id, { includeTrashed: true })
    if (!before?.deletedAt) return false
    await this.db.delete(posts).where(eq(posts.id, id))
    await audit(this.db, 'post.purge', { type: 'post', id }, { before })
    return true
  }
}
