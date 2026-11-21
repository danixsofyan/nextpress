import type { MetadataRoute } from 'next'
import { PageRepository, PostRepository, TaxonomyRepository } from '@/server'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { DOCS, isDocsEnabled } from '@/lib/docs'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL
  const repo = new PostRepository(db)
  const taxonomies = new TaxonomyRepository(db)
  const [posts, pages, categories, tags] = await Promise.all([
    repo.findMany({ status: 'published', limit: 1000, offset: 0 }),
    new PageRepository(db).findMany(),
    taxonomies.findPublishedWithCounts('category', 1000),
    taxonomies.findPublishedWithCounts('tag', 1000),
  ])

  const postUrls = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...postUrls,
    ...pages
      .filter((page) => page.status === 'published')
      .map((page) => ({
        url: `${siteUrl}/${page.slug}`,
        lastModified: page.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    ...[...categories.map((c) => `/category/${c.slug}`), ...tags.map((t) => `/tag/${t.slug}`)].map(
      (path) => ({
        url: `${siteUrl}${path}`,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })
    ),
    ...(isDocsEnabled() ? DOCS : []).map((slug) => ({
      url: `${siteUrl}/docs/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ]
}
