import { revalidatePublicSite } from '../revalidate'
import type { Database } from '@/core/db'
import { type Post, postRevisions, posts, termRelationships, user } from '@/core/schema'
import type { CreatePostInput, UpdatePostInput, ListPostsInput } from '@/core/validators'
import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from 'drizzle-orm'
import { currentActor } from '@/lib/request-context'
import { audit } from '../audit'
import { restoredSlug, trashedSlug } from './trash'
import { sanitizeContent } from '../sanitize'

const MAX_REVISIONS = 30

export const isPubliclyVisible = () =>
  and(
    eq(posts.status, 'published'),
    eq(posts.visibility, 'public'),
    isNull(posts.deletedAt),
    lte(posts.publishedAt, sql`now()`)
  )

export const isPostPublic = (post: {
  status: string
  visibility: string
  deletedAt: Date | null
  publishedAt: Date | null
}) =>
  post.status === 'published' &&
  post.visibility === 'public' &&
  !post.deletedAt &&
  post.publishedAt !== null &&
  post.publishedAt.getTime() <= Date.now()

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

  async findPublic({
    limit,
    offset = 0,
    stickyFirst = false,
  }: {
    limit: number
    offset?: number
    stickyFirst?: boolean
  }) {
    return this.db
      .select()
      .from(posts)
      .where(isPubliclyVisible())
      .orderBy(...(stickyFirst ? [desc(posts.isSticky)] : []), desc(posts.publishedAt))
      .limit(limit)
      .offset(offset)
  }

  async findPublicByAuthor(authorId: string, limit = 50) {
    return this.db
      .select()
      .from(posts)
      .where(and(eq(posts.authorId, authorId), isPubliclyVisible()))
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
  }

  async findAuthor(authorId: string) {
    const [row] = await this.db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(eq(user.id, authorId))
      .limit(1)
    return row ?? null
  }

  async findScheduled(limit = 5) {
    return this.db
      .select({ id: posts.id, title: posts.title, publishedAt: posts.publishedAt })
      .from(posts)
      .where(
        and(
          eq(posts.status, 'published'),
          isNull(posts.deletedAt),
          gt(posts.publishedAt, sql`now()`)
        )
      )
      .orderBy(asc(posts.publishedAt))
      .limit(limit)
  }

  async findRecentDrafts(authorId: string, limit = 3) {
    return this.db
      .select({
        id: posts.id,
        title: posts.title,
        updatedAt: posts.updatedAt,
        excerpt: posts.excerpt,
      })
      .from(posts)
      .where(and(eq(posts.status, 'draft'), eq(posts.authorId, authorId), isNull(posts.deletedAt)))
      .orderBy(desc(posts.updatedAt))
      .limit(limit)
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
        visibility: posts.visibility,
        isSticky: posts.isSticky,
      })
      .from(posts)
      .leftJoin(user, eq(user.id, posts.authorId))
      .where(trashed ? isNotNull(posts.deletedAt) : isNull(posts.deletedAt))
      .orderBy(sql`${posts.createdAt} desc`)
  }

  async findPublishedByTaxonomy(taxonomyId: string, limit = 50) {
    return this.db
      .select({ post: posts })
      .from(posts)
      .innerJoin(termRelationships, eq(termRelationships.postId, posts.id))
      .where(and(eq(termRelationships.taxonomyId, taxonomyId), isPubliclyVisible()))
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .then((rows) => rows.map((r) => r.post))
  }

  async search(query: string, limit = 20) {
    const pattern = `%${query.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
    return this.db
      .select()
      .from(posts)
      .where(
        and(
          isPubliclyVisible(),
          or(
            ilike(posts.title, pattern),
            ilike(posts.excerpt, pattern),
            ilike(posts.content, pattern)
          )
        )
      )
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
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
    const { taxonomyIds, publishedAt: chosen, ...data } = sanitizeContent(input)
    const publishedAt = chosen
      ? new Date(chosen)
      : input.status === 'published'
        ? (options.publishedAt ?? new Date())
        : null
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
    const { taxonomyIds, publishedAt: chosen, ...data } = sanitizeContent(input)
    const contentChanged =
      (data.title !== undefined && data.title !== before.title) ||
      (data.content !== undefined && data.content !== before.content) ||
      (data.excerpt !== undefined && data.excerpt !== before.excerpt)
    if (contentChanged) await this.saveRevision(before)
    const result = await this.db
      .update(posts)
      .set({
        ...data,
        updatedAt: new Date(),
        ...(chosen !== undefined
          ? { publishedAt: chosen ? new Date(chosen) : null }
          : data.status === 'published' && {
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

  private async saveRevision(post: Post) {
    const actor = currentActor()
    await this.db.insert(postRevisions).values({
      postId: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      authorId: actor.userId,
      authorName: actor.actorType === 'api_key' ? 'API key' : null,
    })
    const stale = await this.db
      .select({ id: postRevisions.id })
      .from(postRevisions)
      .where(eq(postRevisions.postId, post.id))
      .orderBy(desc(postRevisions.createdAt))
      .offset(MAX_REVISIONS)
    if (stale.length > 0) {
      await this.db.delete(postRevisions).where(
        inArray(
          postRevisions.id,
          stale.map((r) => r.id)
        )
      )
    }
  }

  async findRevisions(postId: string) {
    return this.db
      .select({
        id: postRevisions.id,
        title: postRevisions.title,
        createdAt: postRevisions.createdAt,
        authorName: sql<string | null>`coalesce(${user.name}, ${postRevisions.authorName})`,
      })
      .from(postRevisions)
      .leftJoin(user, eq(user.id, postRevisions.authorId))
      .where(eq(postRevisions.postId, postId))
      .orderBy(desc(postRevisions.createdAt))
  }

  async findRevision(postId: string, revisionId: string) {
    const [row] = await this.db
      .select()
      .from(postRevisions)
      .where(and(eq(postRevisions.id, revisionId), eq(postRevisions.postId, postId)))
      .limit(1)
    return row ?? null
  }

  async restoreRevision(postId: string, revisionId: string) {
    const revision = await this.findRevision(postId, revisionId)
    if (!revision) return null
    return this.update(postId, {
      title: revision.title,
      content: revision.content,
      ...(revision.excerpt !== null && { excerpt: revision.excerpt }),
    })
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
