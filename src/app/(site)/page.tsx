import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { PageBody } from '@/components/page-body'
import { db } from '@/lib/db'
import { absoluteUrl, faqSchema, pageFaq } from '@/lib/seo'
import { getSiteSettings } from '@/lib/site'
import { getActiveTheme } from '@/lib/themes'
import { PageRepository, PostRepository } from '@/server'
import type { Metadata } from 'next'

export const revalidate = 3600

async function getFrontPage() {
  const site = await getSiteSettings()
  if (site.showOnFront !== 'page') return null
  const page = await new PageRepository(db).findById(site.pageOnFront).catch(() => null)
  return page?.status === 'published' ? page : null
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getFrontPage()
  return {
    alternates: { canonical: '/' },
    ...(page && {
      title: { absolute: page.metaTitle ?? page.title },
      ...(page.metaDescription && { description: page.metaDescription }),
    }),
  }
}

export default async function HomePage() {
  const site = await getSiteSettings()
  const frontPage = await getFrontPage()

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.title,
      url: absoluteUrl('/'),
      ...(site.description && { description: site.description }),
      publisher: {
        '@type': 'Organization',
        name: site.title,
        url: absoluteUrl('/'),
        ...(site.logo && { logo: site.logo.startsWith('/') ? absoluteUrl(site.logo) : site.logo }),
      },
    },
    ...[frontPage && faqSchema(pageFaq(frontPage.content, frontPage.blocks))].filter(
      (s): s is NonNullable<typeof s> => Boolean(s)
    ),
  ]

  if (frontPage)
    return (
      <>
        <JsonLd data={schema} />
        <PageBody page={frontPage} />
      </>
    )

  const posts = await new PostRepository(db).findPublic({
    limit: site.postsPerPage,
    stickyFirst: true,
  })

  const { PostList } = (await getActiveTheme()).theme.slots

  return (
    <div className="space-y-12">
      <JsonLd data={schema} />
      <section className="space-y-4 border-b py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{site.title}</h1>
        {site.tagline && (
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">{site.tagline}</p>
        )}
        <Link
          href="/blog"
          className="inline-flex items-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Browse all posts
        </Link>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-semibold">Latest Posts</h2>
        {posts.length === 0 ? (
          <p className="text-muted-foreground">No posts published yet.</p>
        ) : (
          <PostList posts={posts} timeZone={site.timeZone} dateFormat={site.dateFormat} />
        )}
      </section>
    </div>
  )
}
