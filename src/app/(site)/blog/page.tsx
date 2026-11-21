import { db } from '@/lib/db'
import { getSiteSettings } from '@/lib/site'
import { getActiveTheme } from '@/lib/themes'
import { PostRepository } from '@/server'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog',
  alternates: { canonical: '/blog' },
}

type Props = { searchParams: Promise<{ page?: string }> }

export default async function BlogPage({ searchParams }: Props) {
  const site = await getSiteSettings()
  const page = Math.max(1, Number.parseInt((await searchParams).page ?? '1', 10) || 1)
  const rows = await new PostRepository(db).findMany({
    status: 'published',
    limit: site.postsPerPage + 1,
    offset: (page - 1) * site.postsPerPage,
  })
  const posts = rows.slice(0, site.postsPerPage)
  const hasOlder = rows.length > site.postsPerPage

  const { PostList } = (await getActiveTheme()).theme.slots

  return (
    <div className="space-y-8">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Blog</h1>
        {page > 1 && <p className="mt-2 text-muted-foreground">Page {page}</p>}
      </div>
      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts published yet.</p>
      ) : (
        <PostList posts={posts} timeZone={site.timeZone} dateFormat={site.dateFormat} />
      )}
      {(page > 1 || hasOlder) && (
        <nav className="flex justify-between border-t pt-6 text-sm font-medium">
          {page > 1 ? (
            <a href={page === 2 ? '/blog' : `/blog?page=${page - 1}`} className="hover:underline">
              ← Newer posts
            </a>
          ) : (
            <span />
          )}
          {hasOlder && (
            <a href={`/blog?page=${page + 1}`} className="hover:underline">
              Older posts →
            </a>
          )}
        </nav>
      )}
    </div>
  )
}
