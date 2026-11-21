import { revalidatePublicSite } from '../revalidate'
import type { Database } from '@/core/db'
import { type Page, pageRevisions, pages, user } from '@/core/schema'
import type { CreatePageInput, UpdatePageInput } from '@/core/validators'
import { and, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import { currentActor } from '@/lib/request-context'
import { audit } from '../audit'
import { restoredSlug, trashedSlug } from './trash'
import { sanitizeBlocks, sanitizeContent } from '../sanitize'

const MAX_REVISIONS = 30

export class PageRepository {
  constructor(private readonly db: Database) {}

  async findMany() {
    return this.db
      .select()
      .from(pages)
      .where(isNull(pages.deletedAt))
      .orderBy(sql`${pages.createdAt} desc`)
  }

  async findSummaries({ trashed = false }: { trashed?: boolean } = {}) {
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
        deletedAt: pages.deletedAt,
      })
      .from(pages)
      .leftJoin(user, eq(user.id, pages.authorId))
      .where(trashed ? isNotNull(pages.deletedAt) : isNull(pages.deletedAt))
      .orderBy(sql`${pages.createdAt} desc`)
  }

  async findBySlug(slug: string) {
    const result = await this.db
      .select()
      .from(pages)
      .where(and(eq(pages.slug, slug), isNull(pages.deletedAt)))
      .limit(1)
    return result[0] ?? null
  }

  async findById(id: string, { includeTrashed = false }: { includeTrashed?: boolean } = {}) {
    const result = await this.db
      .select()
      .from(pages)
      .where(includeTrashed ? eq(pages.id, id) : and(eq(pages.id, id), isNull(pages.deletedAt)))
      .limit(1)
    return result[0] ?? null
  }

  async create(input: CreatePageInput, options: { authorId?: string | null } = {}) {
    const result = await this.db
      .insert(pages)
      .values({ ...sanitizeBlocks(sanitizeContent(input)), authorId: options.authorId ?? null })
      .returning()
    const page = result[0]!
    await audit(this.db, 'page.create', { type: 'page', id: page.id }, { after: page })
    revalidatePublicSite()
    return page
  }

  async update(id: string, input: UpdatePageInput) {
    const before = await this.findById(id)
    if (!before) return null
    const changed =
      (input.title !== undefined && input.title !== before.title) ||
      (input.content !== undefined && input.content !== before.content) ||
      (input.blocks !== undefined && JSON.stringify(input.blocks) !== JSON.stringify(before.blocks))
    if (changed) await this.saveRevision(before)
    const result = await this.db
      .update(pages)
      .set({ ...sanitizeBlocks(sanitizeContent(input)), updatedAt: new Date() })
      .where(and(eq(pages.id, id), isNull(pages.deletedAt)))
      .returning()
    const after = result[0] ?? null
    await audit(this.db, 'page.update', { type: 'page', id }, { before, after })
    revalidatePublicSite()
    return after
  }

  private async saveRevision(page: Page) {
    const actor = currentActor()
    await this.db.insert(pageRevisions).values({
      pageId: page.id,
      title: page.title,
      content: page.content,
      blocks: page.blocks,
      authorId: actor.userId,
      authorName: actor.actorType === 'api_key' ? 'API key' : null,
    })
    const stale = await this.db
      .select({ id: pageRevisions.id })
      .from(pageRevisions)
      .where(eq(pageRevisions.pageId, page.id))
      .orderBy(desc(pageRevisions.createdAt))
      .offset(MAX_REVISIONS)
    if (stale.length > 0) {
      await this.db.delete(pageRevisions).where(
        inArray(
          pageRevisions.id,
          stale.map((r) => r.id)
        )
      )
    }
  }

  async findRevisions(pageId: string) {
    return this.db
      .select({
        id: pageRevisions.id,
        title: pageRevisions.title,
        createdAt: pageRevisions.createdAt,
        authorName: sql<string | null>`coalesce(${user.name}, ${pageRevisions.authorName})`,
      })
      .from(pageRevisions)
      .leftJoin(user, eq(user.id, pageRevisions.authorId))
      .where(eq(pageRevisions.pageId, pageId))
      .orderBy(desc(pageRevisions.createdAt))
  }

  async restoreRevision(pageId: string, revisionId: string) {
    const [revision] = await this.db
      .select()
      .from(pageRevisions)
      .where(and(eq(pageRevisions.id, revisionId), eq(pageRevisions.pageId, pageId)))
      .limit(1)
    if (!revision) return null
    return this.update(pageId, {
      title: revision.title,
      content: revision.content,
      ...(revision.blocks && { blocks: revision.blocks }),
    })
  }

  async delete(id: string) {
    const before = await this.findById(id)
    if (!before) return false
    await this.db
      .update(pages)
      .set({ deletedAt: new Date(), slug: trashedSlug(before.slug, id) })
      .where(eq(pages.id, id))
    await audit(this.db, 'page.trash', { type: 'page', id }, { before })
    revalidatePublicSite()
    return true
  }

  async restore(id: string) {
    const before = await this.findById(id, { includeTrashed: true })
    if (!before?.deletedAt) return null
    const [after] = await this.db
      .update(pages)
      .set({ deletedAt: null, slug: restoredSlug(before.slug), updatedAt: new Date() })
      .where(eq(pages.id, id))
      .returning()
    await audit(this.db, 'page.restore', { type: 'page', id }, { before, after })
    revalidatePublicSite()
    return after ?? null
  }

  async purge(id: string) {
    const before = await this.findById(id, { includeTrashed: true })
    if (!before?.deletedAt) return false
    await this.db.delete(pages).where(eq(pages.id, id))
    await audit(this.db, 'page.purge', { type: 'page', id }, { before })
    return true
  }
}
