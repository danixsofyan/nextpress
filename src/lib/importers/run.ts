import { PageRepository, PostRepository, TaxonomyRepository } from '@/server'
import { db } from '@/lib/db'
import type { ImportItem, ImportTerm } from './shared'

export type ImportSummary = {
  total: number
  created: number
  skipped: number
  failed: number
  errors: string[]
}

export async function runImport(
  items: ImportItem[],
  statusMode: 'keep' | 'draft',
  authorId: string
): Promise<ImportSummary> {
  const posts = new PostRepository(db)
  const pages = new PageRepository(db)
  const taxonomies = new TaxonomyRepository(db)
  const termIds = new Map<string, string>()
  const usedSlugs = new Set<string>()
  const summary: ImportSummary = {
    total: items.length,
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }

  async function termId(term: ImportTerm, type: 'category' | 'tag') {
    const cached = termIds.get(term.slug)
    if (cached) return cached
    const existing = await taxonomies.findBySlug(term.slug)
    const id = existing
      ? existing.id
      : (await taxonomies.create({ name: term.name, slug: term.slug, type })).id
    termIds.set(term.slug, id)
    return id
  }

  for (const item of items) {
    try {
      let slug = item.slug
      for (let n = 2; usedSlugs.has(`${item.kind}:${slug}`); n++) slug = `${item.slug}-${n}`
      usedSlugs.add(`${item.kind}:${slug}`)

      const repo = item.kind === 'page' ? pages : posts
      if (await repo.findBySlug(slug)) {
        summary.skipped++
        continue
      }

      const status = statusMode === 'draft' ? 'draft' : item.status
      if (item.kind === 'page') {
        await pages.create({ title: item.title, slug, content: item.content, status }, { authorId })
      } else {
        const taxonomyIds: string[] = []
        for (const t of item.categories) taxonomyIds.push(await termId(t, 'category'))
        for (const t of item.tags) taxonomyIds.push(await termId(t, 'tag'))
        await posts.create(
          {
            title: item.title,
            slug,
            content: item.content,
            status,
            ...(item.excerpt && { excerpt: item.excerpt }),
            ...(taxonomyIds.length > 0 && { taxonomyIds: [...new Set(taxonomyIds)] }),
          },
          { publishedAt: item.publishedAt, authorId }
        )
      }
      summary.created++
    } catch (error) {
      summary.failed++
      if (summary.errors.length < 5) {
        summary.errors.push(
          `${item.title}: ${error instanceof Error ? error.message : 'unknown error'}`
        )
      }
    }
  }

  return summary
}
