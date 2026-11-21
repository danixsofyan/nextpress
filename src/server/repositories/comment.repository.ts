import type { Database } from '@/core/db'
import { comments, posts } from '@/core/schema'
import type { CommentStatus, CreateCommentInput } from '@/core/validators'
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm'
import { audit } from '../audit'
import { revalidatePublicSite } from '../revalidate'

export class CommentRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateCommentInput, status: CommentStatus, userId: string | null = null) {
    const [row] = await this.db
      .insert(comments)
      .values({
        postId: input.postId,
        parentId: input.parentId ?? null,
        authorName: input.authorName,
        content: input.content,
        status,
        userId,
      })
      .returning()
    await audit(this.db, 'comment.create', { type: 'comment', id: row!.id }, { after: row })
    if (status === 'approved') revalidatePublicSite()
    return row!
  }

  async findApprovedForPost(postId: string) {
    return this.db
      .select({
        id: comments.id,
        parentId: comments.parentId,
        authorName: comments.authorName,
        content: comments.content,
        createdAt: comments.createdAt,
        userId: comments.userId,
      })
      .from(comments)
      .where(and(eq(comments.postId, postId), eq(comments.status, 'approved')))
      .orderBy(asc(comments.createdAt))
  }

  async findAll() {
    return this.db
      .select({
        id: comments.id,
        authorName: comments.authorName,
        content: comments.content,
        status: comments.status,
        createdAt: comments.createdAt,
        parentId: comments.parentId,
        postId: comments.postId,
        postTitle: posts.title,
        postSlug: posts.slug,
      })
      .from(comments)
      .innerJoin(posts, eq(posts.id, comments.postId))
      .orderBy(desc(comments.createdAt))
      .limit(1000)
  }

  async findRecent(limit = 5) {
    return this.db
      .select({
        id: comments.id,
        authorName: comments.authorName,
        content: comments.content,
        status: comments.status,
        createdAt: comments.createdAt,
        postTitle: posts.title,
        postSlug: posts.slug,
      })
      .from(comments)
      .innerJoin(posts, eq(posts.id, comments.postId))
      .where(inArray(comments.status, ['pending', 'approved']))
      .orderBy(desc(comments.createdAt))
      .limit(limit)
  }

  async countPending() {
    const [row] = await this.db
      .select({ n: count() })
      .from(comments)
      .where(eq(comments.status, 'pending'))
    return row?.n ?? 0
  }

  async findById(id: string) {
    const [row] = await this.db.select().from(comments).where(eq(comments.id, id)).limit(1)
    return row ?? null
  }

  async setStatus(id: string, status: CommentStatus) {
    const before = await this.findById(id)
    if (!before) return null
    const [after] = await this.db
      .update(comments)
      .set({ status, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning()
    await audit(this.db, `comment.${status}`, { type: 'comment', id }, { before, after })
    if (before.status === 'approved' || status === 'approved') revalidatePublicSite()
    return after ?? null
  }

  async delete(id: string) {
    const before = await this.findById(id)
    if (!before || (before.status !== 'trash' && before.status !== 'spam')) return false
    await this.db.delete(comments).where(eq(comments.id, id))
    await audit(this.db, 'comment.delete', { type: 'comment', id }, { before })
    return true
  }
}
