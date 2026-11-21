import { and, eq, inArray, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { pages, posts, taxonomies, termRelationships, user } from '@/core/schema'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { type ExportItem, type ExportTerm, buildWxr } from '@/lib/exporters/wxr'
import { getSiteSettings } from '@/lib/site'

const contentSchema = z.enum(['all', 'posts', 'pages']).catch('all')

async function exportPosts(): Promise<ExportItem[]> {
  const rows = await db
    .select({ post: posts, author: user.name })
    .from(posts)
    .leftJoin(user, eq(user.id, posts.authorId))
    .where(isNull(posts.deletedAt))
  const ids = rows.map((r) => r.post.id)
  const links = ids.length
    ? await db
        .select({
          postId: termRelationships.postId,
          name: taxonomies.name,
          slug: taxonomies.slug,
          type: taxonomies.type,
        })
        .from(termRelationships)
        .innerJoin(taxonomies, eq(taxonomies.id, termRelationships.taxonomyId))
        .where(inArray(termRelationships.postId, ids))
    : []
  return rows.map(({ post, author }) => ({
    kind: 'post',
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    status: post.status,
    publishedAt: post.publishedAt,
    author,
    terms: links
      .filter((l) => l.postId === post.id && l.type !== 'custom')
      .map((l) => ({ name: l.name, slug: l.slug, type: l.type as ExportTerm['type'] })),
  }))
}

async function exportPages(): Promise<ExportItem[]> {
  const rows = await db
    .select({ page: pages, author: user.name })
    .from(pages)
    .leftJoin(user, eq(user.id, pages.authorId))
    .where(and(isNull(pages.deletedAt)))
  return rows.map(({ page, author }) => ({
    kind: 'page',
    id: page.id,
    title: page.title,
    slug: page.slug,
    content: page.content,
    excerpt: null,
    status: page.status,
    publishedAt: page.createdAt,
    author,
    terms: [],
  }))
}

export async function GET(request: Request) {
  const session = await requireRole(request, 'administrator')
  if (session instanceof Response) return session
  const content = contentSchema.parse(new URL(request.url).searchParams.get('content'))
  const site = await getSiteSettings()
  const items = [
    ...(content !== 'pages' ? await exportPosts() : []),
    ...(content !== 'posts' ? await exportPages() : []),
  ]
  const xml = buildWxr(
    { title: site.title, url: env.NEXT_PUBLIC_SITE_URL, description: site.description },
    items
  )
  const date = new Date().toISOString().slice(0, 10)
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="nextpress-${content}-${date}.xml"`,
      'Cache-Control': 'no-store',
    },
  })
}
