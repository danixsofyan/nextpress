import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { posts, pages, media, taxonomies } from '@/core/schema'
import { sql, eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const session = await requireRole(request, 'author')
  if (session instanceof Response) return session

  const [postsCount, publishedCount, pagesCount, mediaCount, taxonomiesCount] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(posts),
    db
      .select({ published: sql<number>`count(*)::int` })
      .from(posts)
      .where(eq(posts.status, 'published')),
    db.select({ total: sql<number>`count(*)::int` }).from(pages),
    db.select({ total: sql<number>`count(*)::int` }).from(media),
    db.select({ total: sql<number>`count(*)::int` }).from(taxonomies),
  ])

  return Response.json({
    totalPosts: postsCount[0]?.total ?? 0,
    publishedPosts: publishedCount[0]?.published ?? 0,
    totalPages: pagesCount[0]?.total ?? 0,
    totalMedia: mediaCount[0]?.total ?? 0,
    totalTaxonomies: taxonomiesCount[0]?.total ?? 0,
  })
}
