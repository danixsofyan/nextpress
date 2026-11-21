import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getSiteSettings } from '@/lib/site'
import { getActiveTheme } from '@/lib/themes'
import { PostRepository } from '@/server'
import { WithSidebar } from './widget-area'

export const blogPageHref = (page: number) => (page <= 1 ? '/blog' : `/blog/page/${page}`)

export async function BlogIndex({ page }: { page: number }) {
  const site = await getSiteSettings()
  const rows = await new PostRepository(db).findPublic({
    limit: site.postsPerPage + 1,
    offset: (page - 1) * site.postsPerPage,
    stickyFirst: true,
  })
  const posts = rows.slice(0, site.postsPerPage)
  if (page > 1 && posts.length === 0) notFound()
  const hasOlder = rows.length > site.postsPerPage
  const { PostList } = (await getActiveTheme()).theme.slots

  return (
    <WithSidebar>
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
              <Link href={blogPageHref(page - 1)} className="hover:underline">
                ← Newer posts
              </Link>
            ) : (
              <span />
            )}
            {hasOlder && (
              <Link href={blogPageHref(page + 1)} className="hover:underline">
                Older posts →
              </Link>
            )}
          </nav>
        )}
      </div>
    </WithSidebar>
  )
}
