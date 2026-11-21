import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getSiteSettings } from '@/lib/site'
import { getActiveTheme } from '@/lib/themes'
import { PostRepository } from '@/server'
import { WithSidebar } from '@/components/widget-area'

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false, follow: true },
}

interface Props {
  searchParams: Promise<{ q?: string | string[] }>
}

export default async function SearchPage({ searchParams }: Props) {
  const raw = (await searchParams).q
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 100) ?? ''
  const [site, results, { theme }] = await Promise.all([
    getSiteSettings(),
    query ? new PostRepository(db).search(query) : Promise.resolve([]),
    getActiveTheme(),
  ])
  const { PostList } = theme.slots
  return (
    <WithSidebar>
      <div className="space-y-8">
        <div className="border-b pb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {query ? `Search results for “${query}”` : 'Search'}
          </h1>
          <form action="/search" role="search" className="mt-4 flex max-w-xl gap-2">
            <label htmlFor="search-page-q" className="sr-only">
              Search posts
            </label>
            <input
              id="search-page-q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search posts…"
              className="h-10 flex-1 rounded-md border bg-background px-3 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Search
            </button>
          </form>
        </div>
        {query && results.length === 0 && (
          <p className="text-muted-foreground">No posts match your search. Try other words.</p>
        )}
        {results.length > 0 && (
          <PostList posts={results} timeZone={site.timeZone} dateFormat={site.dateFormat} />
        )}
      </div>
    </WithSidebar>
  )
}
