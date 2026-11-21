import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { db } from '@/lib/db'
import { getActiveTheme } from '@/lib/themes'
import { PostRepository, TaxonomyRepository } from '@/server'
import { WithSidebar } from './widget-area'

type ArchiveType = 'category' | 'tag'

export const getArchive = cache(async (type: ArchiveType, slug: string) => {
  const taxonomy = await new TaxonomyRepository(db).findBySlug(slug)
  if (!taxonomy || taxonomy.type !== type) return null
  const posts = await new PostRepository(db).findPublishedByTaxonomy(taxonomy.id)
  return { taxonomy, posts }
})

export async function archiveMetadata(type: ArchiveType, slug: string): Promise<Metadata> {
  const archive = await getArchive(type, slug)
  if (!archive) return {}
  const { taxonomy } = archive
  return {
    title: type === 'category' ? taxonomy.name : `#${taxonomy.name}`,
    description:
      taxonomy.description ??
      `${type === 'category' ? 'Posts in' : 'Posts tagged'} ${taxonomy.name}`,
    alternates: { canonical: `/${type}/${taxonomy.slug}` },
  }
}

export async function TaxonomyArchive({ type, slug }: { type: ArchiveType; slug: string }) {
  const archive = await getArchive(type, slug)
  if (!archive) notFound()
  const { CategoryPage, TagPage } = (await getActiveTheme()).theme.slots
  const Archive = type === 'category' ? CategoryPage : TagPage
  return (
    <WithSidebar>
      <Archive taxonomy={archive.taxonomy} posts={archive.posts} />
    </WithSidebar>
  )
}
